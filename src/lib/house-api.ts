import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { prunePayload } from "@/lib/merge";
import { todayIsoKst } from "@/lib/utils";
import type { BoardPayload, InvitePreview, ServerHouse } from "@/lib/house-types";

const memberSchema = z.object({ id: z.string(), name: z.string() });
const choreSchema = z.object({
  id: z.string(),
  title: z.string(),
  cadence: z.enum(["daily", "weekly"]),
  seed: z.number(),
  active: z.boolean(),
});
const shopSchema = z.object({
  id: z.string(),
  name: z.string(),
  done: z.boolean(),
});
const completionSchema = z.object({
  choreId: z.string(),
  date: z.string(),
  memberId: z.string(),
});
const overrideSchema = z.object({
  choreId: z.string(),
  date: z.string(),
  memberId: z.string(),
});
const mealSchema = z.object({ date: z.string(), dish: z.string() });
const absenceSchema = z.object({
  id: z.string(),
  memberId: z.string(),
  start: z.string(),
  end: z.string(),
});

const boardSchema = z.object({
  members: z.array(memberSchema),
  chores: z.array(choreSchema),
  shopping: z.array(shopSchema),
  completions: z.array(completionSchema),
  overrides: z.array(overrideSchema),
  meals: z.array(mealSchema),
  absences: z.array(absenceSchema).default([]),
});

const createSchema = boardSchema.extend({ meId: z.string() });
const joinSchema = z.object({
  code: z.string().trim().min(4).max(12),
  memberId: z.string().min(1),
});
const saveSchema = z.object({
  payload: boardSchema,
  revision: z.number().int().nonnegative(),
});

function parsePayload(raw: unknown): BoardPayload {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  const parsed = boardSchema.parse(value);
  return { ...parsed, absences: parsed.absences ?? [] };
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function takenIds(houseId: string) {
  const sql = await getSql();
  const rows = await sql<{ member_id: string }>`
    select member_id from house_members where house_id = ${houseId}
  `;
  return rows.map((r) => r.member_id);
}

async function houseForUser(userId: string): Promise<ServerHouse | null> {
  const sql = await getSql();
  const rows = await sql<{
    id: string;
    invite_code: string;
    member_id: string;
    payload: unknown;
    revision: number | string | null;
  }>`
    select h.id, h.invite_code, m.member_id, b.payload, b.revision
    from house_members m
    join houses h on h.id = m.house_id
    join house_boards b on b.house_id = h.id
    where m.user_id = ${userId}
    limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    houseId: row.id,
    inviteCode: row.invite_code,
    memberId: row.member_id,
    revision: Number(row.revision ?? 1),
    takenMemberIds: await takenIds(row.id),
    payload: parsePayload(row.payload),
  };
}

async function detachUser(userId: string) {
  const sql = await getSql();
  const rows = await sql<{ house_id: string; owner_id: string }>`
    select h.id as house_id, h.owner_id
    from house_members m
    join houses h on h.id = m.house_id
    where m.user_id = ${userId}
  `;
  await sql`delete from house_members where user_id = ${userId}`;
  for (const row of rows) {
    const left = await sql<{ user_id: string }>`
      select user_id from house_members where house_id = ${row.house_id} limit 1
    `;
    if (!left[0]) {
      await sql`delete from houses where id = ${row.house_id}`;
    } else if (row.owner_id === userId) {
      await sql`update houses set owner_id = ${left[0].user_id} where id = ${row.house_id}`;
    }
  }
}

export const getMyHouse = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => houseForUser(context.userId));

export const peekInvite = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ code: z.string().trim().min(4).max(12) }).parse(input))
  .middleware([authMiddleware])
  .handler(async ({ data }): Promise<InvitePreview> => {
    const sql = await getSql();
    const code = data.code.toUpperCase();
    const houses = await sql<{ id: string; invite_code: string }>`
      select id, invite_code from houses where invite_code = ${code} limit 1
    `;
    const house = houses[0];
    if (!house) throw new Error("코드를 찾지 못했습니다.");
    const boardRows = await sql<{ payload: unknown }>`
      select payload from house_boards where house_id = ${house.id} limit 1
    `;
    const payload = parsePayload(boardRows[0]?.payload);
    return {
      inviteCode: house.invite_code,
      members: payload.members,
      takenMemberIds: await takenIds(house.id),
    };
  });

export const createHouse = createServerFn({ method: "POST" })
  .validator((input: unknown) => createSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const existing = await houseForUser(context.userId);
    if (existing) return existing;

    const sql = await getSql();
    const houseId = crypto.randomUUID();
    const { meId, ...rest } = data;
    const payload = prunePayload(
      { ...rest, absences: rest.absences ?? [] },
      todayIsoKst(),
    );
    const json = JSON.stringify(payload);

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const inviteCode = makeCode();
      try {
        await sql`
          insert into houses (id, invite_code, owner_id)
          values (${houseId}, ${inviteCode}, ${context.userId})
        `;
        await sql`
          insert into house_members (house_id, user_id, member_id)
          values (${houseId}, ${context.userId}, ${meId})
        `;
        await sql.query(
          "insert into house_boards (house_id, payload, revision) values ($1, $2::jsonb, 1)",
          [houseId, json],
        );
        return {
          houseId,
          inviteCode,
          memberId: meId,
          revision: 1,
          takenMemberIds: [meId],
          payload,
        } satisfies ServerHouse;
      } catch {
        if (attempt === 7) throw new Error("집을 만들지 못했습니다.");
      }
    }
    throw new Error("집을 만들지 못했습니다.");
  });

export const saveBoard = createServerFn({ method: "POST" })
  .validator((input: unknown) => saveSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const payload = prunePayload(data.payload, todayIsoKst());
    const json = JSON.stringify(payload);
    const updated = await sql.query<{ house_id: string; revision: number | string }>(
      `update house_boards b
       set payload = $2::jsonb, revision = b.revision + 1, updated_at = now()
       from house_members m
       where b.house_id = m.house_id and m.user_id = $1 and b.revision = $3
       returning b.house_id, b.revision`,
      [context.userId, json, data.revision],
    );
    if (updated.length > 0) {
      return {
        ok: true as const,
        conflict: false as const,
        revision: Number(updated[0].revision),
        house: null,
      };
    }
    const house = await houseForUser(context.userId);
    return {
      ok: false as const,
      conflict: true as const,
      revision: house?.revision ?? data.revision,
      house,
    };
  });

export const joinHouse = createServerFn({ method: "POST" })
  .validator((input: unknown) => joinSchema.parse(input))
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const code = data.code.toUpperCase();
    const houses = await sql<{ id: string; invite_code: string }>`
      select id, invite_code from houses where invite_code = ${code} limit 1
    `;
    const house = houses[0];
    if (!house) throw new Error("코드를 찾지 못했습니다.");

    const current = await houseForUser(context.userId);
    if (current && current.houseId !== house.id) {
      await detachUser(context.userId);
    }

    const boardRows = await sql<{ payload: unknown; revision: number | string | null }>`
      select payload, revision from house_boards where house_id = ${house.id} limit 1
    `;
    const payload = parsePayload(boardRows[0]?.payload);
    const seat = payload.members.find((m) => m.id === data.memberId);
    if (!seat) throw new Error("그 자리가 없습니다.");

    const taken = await takenIds(house.id);
    const already = current?.houseId === house.id;
    if (!already && taken.includes(seat.id)) {
      throw new Error("이미 누군가 쓰는 자리입니다.");
    }

    if (!already) {
      try {
        await sql`
          insert into house_members (house_id, user_id, member_id)
          values (${house.id}, ${context.userId}, ${seat.id})
        `;
      } catch {
        throw new Error("이미 누군가 쓰는 자리입니다.");
      }
    } else {
      await sql`
        update house_members
        set member_id = ${seat.id}
        where user_id = ${context.userId} and house_id = ${house.id}
      `;
    }

    return {
      houseId: house.id,
      inviteCode: house.invite_code,
      memberId: seat.id,
      revision: Number(boardRows[0]?.revision ?? 1),
      takenMemberIds: await takenIds(house.id),
      payload,
    } satisfies ServerHouse;
  });

export const setMyMember = createServerFn({ method: "POST" })
  .validator((memberId: unknown) => z.string().min(1).parse(memberId))
  .middleware([authMiddleware])
  .handler(async ({ context, data: memberId }) => {
    const sql = await getSql();
    const house = await houseForUser(context.userId);
    if (!house) throw new Error("집이 없습니다.");
    if (
      house.takenMemberIds.includes(memberId) &&
      house.memberId !== memberId
    ) {
      throw new Error("이미 누군가 쓰는 자리입니다.");
    }
    await sql`
      update house_members
      set member_id = ${memberId}
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const leaveHouse = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await detachUser(context.userId);
    return { ok: true };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await detachUser(context.userId);
    await sql`delete from "session" where "userId" = ${context.userId}`;
    await sql`delete from "account" where "userId" = ${context.userId}`;
    await sql`delete from "user" where "id" = ${context.userId}`;
    return { ok: true };
  });

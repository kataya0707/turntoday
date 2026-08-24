export type Cadence = "daily" | "weekly";

export type Member = { id: string; name: string };

export type Chore = {
  id: string;
  title: string;
  cadence: Cadence;
  seed: number;
  active: boolean;
};

export type ShopItem = { id: string; name: string; done: boolean };

export type Completion = { choreId: string; date: string; memberId: string };

export type Override = { choreId: string; date: string; memberId: string };

export type Meal = { date: string; dish: string };

export type Absence = {
  id: string;
  memberId: string;
  start: string;
  end: string;
};

export type BoardPayload = {
  members: Member[];
  chores: Chore[];
  shopping: ShopItem[];
  completions: Completion[];
  overrides: Override[];
  meals: Meal[];
  absences: Absence[];
};

export type ServerHouse = {
  houseId: string;
  inviteCode: string;
  memberId: string;
  revision: number;
  takenMemberIds: string[];
  payload: BoardPayload;
};

export type InvitePreview = {
  inviteCode: string;
  members: Member[];
  takenMemberIds: string[];
};

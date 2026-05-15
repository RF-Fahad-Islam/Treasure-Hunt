import { insforge } from "@/lib/insforge";

export interface MiniGameScore {
  id?: string;
  nickname: string;
  score: number;
  created_at?: string;
}

export async function submitScore(nickname: string, score: number) {
  const { data, error } = await insforge.database
    .from("mini_game_scores")
    .insert([{ nickname, score }])
    .select();
  
  if (error) {
    console.error("Error submitting score:", error);
    // Fallback to local storage if table doesn't exist
    const localScores = JSON.parse(localStorage.getItem("dino_scores") || "[]");
    localScores.push({ nickname, score, created_at: new Date().toISOString() });
    localStorage.setItem("dino_scores", JSON.stringify(localScores.sort((a: any, b: any) => b.score - a.score).slice(0, 10)));
    return localScores;
  }
  return data;
}

export async function fetchMiniGameLeaderboard(): Promise<MiniGameScore[]> {
  const { data, error } = await insforge.database
    .from("mini_game_scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching leaderboard:", error);
    return JSON.parse(localStorage.getItem("dino_scores") || "[]");
  }
  return data as MiniGameScore[];
}

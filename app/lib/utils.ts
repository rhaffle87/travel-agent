import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatDate = (dateString: string): string => {
  return dayjs(dateString).format("MMMM DD, YYYY");
};

export function parseMarkdownToJson(markdownText: string): unknown | null {
  if (!markdownText || typeof markdownText !== "string") {
    return null;
  }

  try {
    const fencedRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
    const fencedMatch = markdownText.match(fencedRegex);

    if (fencedMatch?.[1]) {
      const cleaned = cleanJsonString(fencedMatch[1]);
      return safeParse(cleaned);
    }

    const direct = cleanJsonString(markdownText.trim());
    const directParsed = safeParse(direct);
    if (directParsed) return directParsed;

    const extracted = extractBalancedJson(markdownText);
    if (extracted) {
      const cleaned = cleanJsonString(extracted);
      return safeParse(cleaned);
    }

    console.error("No valid JSON structure found.");
    return null;

  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

// Helper Functionn
function safeParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function cleanJsonString(text: string): string {
  let cleaned = text.trim();

  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");

  const openBraces = (cleaned.match(/{/g) || []).length;
  const closeBraces = (cleaned.match(/}/g) || []).length;
  const openBrackets = (cleaned.match(/\[/g) || []).length;
  const closeBrackets = (cleaned.match(/\]/g) || []).length;

  if (openBraces > closeBraces) {
    cleaned += "}".repeat(openBraces - closeBraces);
  }

  if (openBrackets > closeBrackets) {
    cleaned += "]".repeat(openBrackets - closeBrackets);
  }

  return cleaned;
}

function extractBalancedJson(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") depth--;

    if (depth === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

export function parseTripData(jsonString: string): Trip | null {
  try {
    const data: Trip = JSON.parse(jsonString);

    return data;
  } catch (error) {
    console.error("Failed to parse trip data:", error);
    return null;
  }
}

export function getFirstWord(input: string = ""): string {
  return input.trim().split(/\s+/)[0] || "";
}

export const calculateTrendPercentage = (
  countOfThisMonth: number,
  countOfLastMonth: number
): TrendResult => {
  if (countOfLastMonth === 0) {
    return countOfThisMonth === 0
      ? { trend: "no change", percentage: 0 }
      : { trend: "increment", percentage: 100 };
  }

  const change = countOfThisMonth - countOfLastMonth;
  const percentage = Math.abs((change / countOfLastMonth) * 100);

  if (change > 0) {
    return { trend: "increment", percentage };
  } else if (change < 0) {
    return { trend: "decrement", percentage };
  } else {
    return { trend: "no change", percentage: 0 };
  }
};

export const formatKey = (key: keyof TripFormData) => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
};

export function validateTrip(data: any, requestedDuration: number) {
  if (!data) return false

  if (data.duration !== requestedDuration) return false

  if (!Array.isArray(data.itinerary)) return false

  if (data.itinerary.length !== requestedDuration) return false

  if (requestedDuration < 1 || requestedDuration > 10) return false

  return true
}
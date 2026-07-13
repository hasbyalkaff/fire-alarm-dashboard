import { handleReport } from "@/lib/reports-route";

export async function GET(request: Request) {
  return handleReport(request, "monthly");
}

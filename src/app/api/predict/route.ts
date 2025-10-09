import { PredictionService } from "@/app/services/PredictionService";
import { NextResponse } from "next/server";

const parseStringArray = (array: string | null) => {
    if (array == undefined) return;
    return array.split(',').map(number => parseInt(number));
}

export async function GET(request: Request) {
    try{
        const { searchParams } = new URL(request.url);
        const teamWith = parseStringArray(searchParams.get("teamWith"));
        const teamVS = parseStringArray(searchParams.get("teamVs"));

        const prediction = await PredictionService.calculateNextPick(teamWith, teamVS);
        return NextResponse.json(prediction);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}
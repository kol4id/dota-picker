import { HeroService } from "@/app/services/HeroService";
import { NextResponse } from "next/server";


export async function GET() {
    try{
        const heroes = await HeroService.fetchHerosMatchUps();
        return NextResponse.json(heroes);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}

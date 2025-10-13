import { HeroService } from "@/app/services/HeroService";
import { NextResponse } from "next/server";


export async function GET() {
    try{
        console.time('hero')
        const heroes = await HeroService.getHeroes();
        console.timeEnd('hero')
        return NextResponse.json(heroes);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}

export async function PUT() {
    try{
        const heroes = await HeroService.fetchHeroes();
        return NextResponse.json(heroes);
    } catch (error: unknown) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "Unknown error" }, { status: 500 });
    }
}
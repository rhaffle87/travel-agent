import { ID } from "appwrite";
import { data, type ActionFunctionArgs } from "react-router";
import { appwriteConfig, database } from "~/appwrite/client";
import { parseMarkdownToJson, parseTripData } from "~/lib/utils";
import { createProduct } from "~/lib/stripe";

export const action = async ({ request }: ActionFunctionArgs) => {
    const {
        country,
        numberOfDays,
        travelStyle,
        interests,
        budget,
        groupType,
        userId,
    } = await request.json();

    const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY!;

    try {
        console.log("Generating travel plan...");

        const duration = Math.min(Math.max(numberOfDays, 1), 10)

        const maxTokens = duration * 500

        const prompt = `
        Generate a ${duration}-day travel itinerary for ${country} based on the following user information:
        Budget: '${budget}'
        Interests: '${interests}'
        TravelStyle: '${travelStyle}'
        GroupType: '${groupType}'

        Constraints:
        - Country: ${country}
        - Duration: ${duration}
        - Duration MUST be exactly ${duration}
        - Max duration allowed: 10
        - Group type: ${groupType}
        - Travel style: ${travelStyle}
        - Interest: ${interests}
        - Budget: ${budget}

        STRICT RULES:
        1. Return ONLY valid JSON.
        2. No markdown.
        3. No commentary.
        4. Itinerary length MUST equal duration.

        Return the itinerary and lowest estimated price in a clean, non-markdown JSON format with the following structure:
        {
            "name": "A descriptive title for the trip",
            "description": "A brief description of the trip and its highlights not exceeding 100 words",
            "estimatedPrice": "Lowest average price for the trip in USD, e.g.$price",
            "duration": ${duration},
            "budget": "${budget}",
            "travelStyle": "${travelStyle}",
            "country": "${country}",
            "interests": "${interests}",
            "groupType": "${groupType}",
            "bestTimeToVisit": [
                '🌸 Season (from month to month): reason to visit',
                '☀️ Season (from month to month): reason to visit',
                '🍁 Season (from month to month): reason to visit',
                '❄️ Season (from month to month): reason to visit'
            ],
            "weatherInfo": [
                '☀️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
                '🌦️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
                '🌧️ Season: temperature range in Celsius (temperature range in Fahrenheit)',
                '❄️ Season: temperature range in Celsius (temperature range in Fahrenheit)'
            ],
            "location": {
                "city": "name of the city or region",
                "coordinates": [latitude, longitude],
                "openStreetMap": "link to open street map"
            },
            "itinerary": [
                {
                    "day": 1,
                    "location": "City/Region Name",
                    "activities": [
                        {"time": "Morning", "description": "🏰 Visit the local historic castle and enjoy a scenic walk"},
                        {"time": "Afternoon", "description": "🖼️ Explore a famous art museum with a guided tour"},
                        {"time": "Evening", "description": "🍷 Dine at a rooftop restaurant with local wine"}
                    ]
                },
                ...
            ]
        }
        `;

        // const controller = new AbortController();
        // const timeout = setTimeout(() => controller.abort(), 300000);

        const startTime = Date.now();

        const ollamaResponse = await fetch(
        "http://localhost:11434/api/generate",
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // signal: controller.signal,
            body: JSON.stringify({
            model: "phi3:mini",
            prompt,
            stream: false,            
            format: "json",           
            options: {
                temperature: 0.1,      
                num_predict: maxTokens,
                top_p: 0.9       
            }
            }),
        }
        );

        // clearTimeout(timeout);

        if (!ollamaResponse.ok) {
            throw new Error("Failed to connect to Ollama");
        }

        const ollamaData = await ollamaResponse.json();
        const rawText = (ollamaData.response || "").trim();

        const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`Ollama generation time: ${generationTime}s`);

        const trip = parseMarkdownToJson(rawText);

        // Fallback: direct JSON parse (if model returned pure JSON)
        if (!trip) {
            console.error("Model returned invalid JSON:", rawText);
            throw new Error("Invalid JSON returned from model");
        }

        console.log("Travel plan generated successfully.");

        const imageResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
                `${country} ${interests} ${travelStyle}`
            )}&client_id=${unsplashApiKey}`
        );

        const imageJson = await imageResponse.json();

        const imageUrls = (imageJson.results || [])
            .slice(0, 3)
            .map((result: any) => result.urls?.regular || null);

        const result = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripsTableId,
            ID.unique(),
            {
                tripDetails: JSON.stringify(trip),
                createdAt: new Date().toISOString(),
                imageUrls,
                userId,
            }
        )

        const tripDetail = parseTripData(result.tripDetails) as Trip;
        const tripPrice = parseInt(tripDetail.estimatedPrice.replace('$', ''), 10)
        const paymentLink = await createProduct(
            tripDetail.name,
            tripDetail.description,
            imageUrls,
            tripPrice,
            result.$id
        )

        await database.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.tripsTableId,
            result.$id,
            {
                payment_link: paymentLink.url
            }
        )

        console.log("Trip saved to database:", result.$id);
        return data({ $id: result.$id })
        
    } catch (e: any) {
    console.error("Error generating travel plan:", e);
    throw new Response("Failed to generate trip", { status: 500 });
  }
}
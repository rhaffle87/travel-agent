import { Query } from "appwrite"
import { appwriteConfig, database } from "./client"

export const getAllTrips = async (limit: number, offset: number) => {
    const allTrips = await database.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.tripsTableId,
        [Query.limit(limit), Query.offset(offset), Query.orderDesc("createdAt")]
    )

    if (allTrips.total === 0) {
        console.error('No trips found in the database.')
        return { allTrips: [], total: 0 }
    }

    return {
        allTrips: allTrips.documents,
        total: allTrips.total,
    }
}

export const getTripById = async (tripId: string) => {
    const trip = await database.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.tripsTableId,
        tripId
    )

    if (!trip.$id) {
        console.log('Trip with ID ${tripId} not found.')
        return null
    }

    return trip
}




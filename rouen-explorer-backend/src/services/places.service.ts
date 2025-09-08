import { Place } from '../models/Place';
import connectDB from '../config/database';

export class PlacesService {
  async getAllPlaces() {
    await connectDB();
    return await Place.find({ isActive: true });
  }

  async getPlaceById(id: string) {
    await connectDB();
    return await Place.findById(id);
  }

  async createPlace(placeData: any) {
    await connectDB();
    const place = new Place(placeData);
    return await place.save();
  }

  async updatePlace(id: string, updateData: any) {
    await connectDB();
    return await Place.findByIdAndUpdate(id, updateData, { new: true });
  }

  async deletePlace(id: string) {
    await connectDB();
    return await Place.findByIdAndUpdate(id, { isActive: false });
  }

  async searchPlaces(query: string) {
    await connectDB();
    return await Place.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { category: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    });
  }

  async getPlacesByCategory(category: string) {
    await connectDB();
    return await Place.find({ category, isActive: true });
  }
}

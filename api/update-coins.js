import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  coins: { type: Number, default: 100 },
  wins: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 }
});
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  await connectDB();
  const { email, coinsToAdd, isWin } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, coins: 100, wins: 0, gamesPlayed: 0 });
    }

    user.coins += coinsToAdd;
    if (isWin) user.wins += 1;
    user.gamesPlayed += 1;
    await user.save();

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

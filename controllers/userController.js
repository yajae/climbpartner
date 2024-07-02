import { UserModel } from '../models/model.js';

export const loginUser = async (req, res) => {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username });
    if (user && user.password === password) {
        res.json({ success: true, userId: user.id });
    } else {
        res.json({ success: false });
    }
};

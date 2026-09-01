import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js"

export const signup = async (req,res) => {

    try {
        // get all the params from the req body
        const { username, email, password } = req.body;
        
        // give error if you didnt receive one of the things
        if(!username || !email || !password){
            return res.status(400).json({
                message: "Username, email and password are required",
            });
        }

        // check if user with same email or username already exists?
        const existingUser = await User.findOne({
            $or : [{username} , {email}],
        })

        if(existingUser){
            return res.status(409).json({
                message: "User already exists",
            });
        }

        // hash the password
        const passwordHash = await bcrypt.hash(password,10);

        // create the new user
        const user = await User.create({
            username,
            email,
            passwordHash,
        });
        
        // send response back
        res.status(201).json({
            message : "User created successfully",
            user : {
                id : user._id,
                username : user.username,
                email : user.email,
            },
        });

    } catch (error) {

        console.error("Signup error:", error);

        return res.status(500).json({
            message: "Server error",
        });

    }

}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate input
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        // 2. Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // 3. Compare password with stored hash
        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        // create jwt token
        // creating accesstoken
        const accessToken = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: "15m",
            }
        );

        //creating refreshtoken
        const refreshToken = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            message: "Login successful",
            accessToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error",
        });
    }
};

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "Refresh token required",
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET
        );

        const accessToken = jwt.sign(
            {
                userId: decoded.userId,
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: "15m",
            }
        );

        return res.status(200).json({
            accessToken,
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired refresh token",
        });
    }
};
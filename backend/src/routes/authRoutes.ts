import express from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { tenantContext } from '../middleware/tenantContext';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Helper to generate token
const generateToken = (user: IUser) => {
    return jwt.sign(
        { 
            id: user._id, 
            email: user.email, 
            role: user.role,
            tenantId: user.tenantId 
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Create new user
        // Defaulting to 't_tesla' tenant for this prototype as per seed data
        user = await User.create({
            email,
            password,
            name,
            role: 'OPERATOR',
            tenantId: 't_tesla', 
            factoryIds: [] 
        });

        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                factoryIds: user.factoryIds
            }
        });
    } catch (error: any) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Server error during signup' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                factoryIds: user.factoryIds
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', tenantContext, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json({
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            tenantId: user.tenantId,
            factoryIds: user.factoryIds
        });
    } catch (error) {
        console.error('Get Me error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST /api/auth/sso
// @desc    Mock SSO Login
// @access  Public
router.post('/sso', async (req, res) => {
    try {
        // Mock SSO behavior: Find or create a specific SSO user
        const email = 'sso_user@tesla.com';
        
        let user = await User.findOne({ email });
        
        if (!user) {
            user = await User.create({
                email,
                password: 'sso_password_placeholder',
                name: 'SSO User',
                role: 'VIEWER',
                tenantId: 't_tesla',
                factoryIds: []
            });
        }

        const token = generateToken(user);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                tenantId: user.tenantId,
                factoryIds: user.factoryIds
            }
        });
    } catch (error) {
        console.error('SSO error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

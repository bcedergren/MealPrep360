const mongoose = require('mongoose');

const MONGO_URI =
	process.env.MONGODB_URI || 'mongodb://localhost:27017/mealprep360';

const userSchema = new mongoose.Schema({
	clerkId: String,
	email: String,
	name: String,
	role: String,
	image: String,
	userSettings: Object,
});
const User = mongoose.model('User', userSchema, 'users');

const adminUserSchema = new mongoose.Schema({
	clerkId: String,
	email: String,
	displayName: String,
	role: String,
	permissions: Object,
	lastLogin: Date,
	createdAt: Date,
});
const AdminUser = mongoose.model('AdminUser', adminUserSchema, 'adminusers');

async function migrate() {
	await mongoose.connect(MONGO_URI);
	const adminUsers = await User.find({ role: /admin/i });
	for (const user of adminUsers) {
		const exists = await AdminUser.findOne({ clerkId: user.clerkId });
		if (exists) {
			console.log(
				`Admin user with clerkId ${user.clerkId} already exists in adminusers.`
			);
			continue;
		}
		await AdminUser.create({
			clerkId: user.clerkId,
			email: user.email,
			displayName: user.name || user.email,
			role: 'admin',
			permissions: {
				canManageUsers: true,
				canModerateContent: true,
				canViewAnalytics: true,
				canManageSystem: true,
			},
			lastLogin: new Date(),
			createdAt: new Date(),
		});
		console.log(
			`Migrated admin user with clerkId ${user.clerkId} to adminusers.`
		);
	}
	await mongoose.disconnect();
	console.log('Migration complete.');
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});

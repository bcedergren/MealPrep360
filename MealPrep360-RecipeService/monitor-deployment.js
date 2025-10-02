"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_fetch_1 = __importDefault(require("node-fetch"));
var dotenv_1 = __importDefault(require("dotenv"));
var redis_1 = require("redis");
var mongodb_1 = require("mongodb");
dotenv_1.default.config();
dotenv_1.default.config({ path: '.env.local' });
var API_URL = 'https://recipes.mealprep360.com';
var CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
var ALERT_THRESHOLD = 3; // Number of consecutive failures before alerting
var DeploymentMonitor = /** @class */ (function () {
    function DeploymentMonitor() {
        this.failureCount = 0;
        this.lastCheckTime = 0;
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is required');
        }
        // Initialize Redis client
        this.redis = (0, redis_1.createClient)({
            url: process.env.REDIS_URL || '',
            socket: {
                host: process.env.REDIS_HOST || 'localhost',
                port: Number(process.env.REDIS_PORT) || 6379,
                tls: true,
                rejectUnauthorized: false,
            },
            password: process.env.REDIS_TOKEN,
        });
        // Initialize MongoDB client
        this.mongoClient = new mongodb_1.MongoClient(process.env.MONGODB_URI);
    }
    DeploymentMonitor.prototype.checkAPI = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, (0, node_fetch_1.default)("".concat(API_URL, "/api/health"))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = (_a.sent());
                        console.log("[".concat(new Date().toISOString(), "] API Health:"), data.status);
                        if (data.status !== 'healthy') {
                            throw new Error("Unhealthy API status: ".concat(data.status));
                        }
                        this.failureCount = 0;
                        return [2 /*return*/, true];
                    case 3:
                        error_1 = _a.sent();
                        console.error("[".concat(new Date().toISOString(), "] API Check Failed:"), error_1 instanceof Error ? error_1.message : String(error_1));
                        this.failureCount++;
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DeploymentMonitor.prototype.checkRedis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ping, queueLength, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.redis.connect()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.redis.ping()];
                    case 2:
                        ping = _a.sent();
                        console.log("[".concat(new Date().toISOString(), "] Redis Health: OK"));
                        return [4 /*yield*/, this.redis.lLen('recipe-generation-queue')];
                    case 3:
                        queueLength = _a.sent();
                        console.log("Queue length: ".concat(queueLength));
                        return [4 /*yield*/, this.redis.quit()];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        error_2 = _a.sent();
                        console.error("[".concat(new Date().toISOString(), "] Redis Check Failed:"), error_2 instanceof Error ? error_2.message : String(error_2));
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DeploymentMonitor.prototype.checkMongoDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            var db, recentJobs, recipeCount, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.mongoClient.connect()];
                    case 1:
                        _a.sent();
                        db = this.mongoClient.db('mealprep360');
                        return [4 /*yield*/, db
                                .collection('jobs')
                                .find({})
                                .sort({ createdAt: -1 })
                                .limit(5)
                                .toArray()];
                    case 2:
                        recentJobs = (_a.sent());
                        console.log("[".concat(new Date().toISOString(), "] MongoDB Health: OK"));
                        console.log('Recent Jobs:', recentJobs.map(function (job) { return ({
                            id: job.id,
                            status: job.status,
                            progress: job.progress,
                            total: job.total,
                        }); }));
                        return [4 /*yield*/, db.collection('recipes').countDocuments()];
                    case 3:
                        recipeCount = _a.sent();
                        console.log("Total Recipes: ".concat(recipeCount));
                        return [4 /*yield*/, this.mongoClient.close()];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 5:
                        error_3 = _a.sent();
                        console.error("[".concat(new Date().toISOString(), "] MongoDB Check Failed:"), error_3 instanceof Error ? error_3.message : String(error_3));
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DeploymentMonitor.prototype.checkPerformance = function () {
        return __awaiter(this, void 0, void 0, function () {
            var start, response, latency, data, error_4;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        start = Date.now();
                        return [4 /*yield*/, (0, node_fetch_1.default)("".concat(API_URL, "/api/performance"))];
                    case 1:
                        response = _c.sent();
                        latency = Date.now() - start;
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = (_c.sent());
                        console.log("[".concat(new Date().toISOString(), "] Performance Check:"));
                        console.log("- Latency: ".concat(latency, "ms"));
                        console.log("- Database Metrics:", (_a = data.metrics) === null || _a === void 0 ? void 0 : _a.database);
                        console.log("- System Metrics:", (_b = data.metrics) === null || _b === void 0 ? void 0 : _b.system);
                        if (latency > 2000) {
                            // Alert if latency > 2s
                            console.warn("High latency detected: ".concat(latency, "ms"));
                        }
                        return [2 /*return*/, true];
                    case 3:
                        error_4 = _c.sent();
                        console.error("[".concat(new Date().toISOString(), "] Performance Check Failed:"), error_4 instanceof Error ? error_4.message : String(error_4));
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DeploymentMonitor.prototype.runChecks = function () {
        return __awaiter(this, void 0, void 0, function () {
            var results, allHealthy;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("\n[".concat(new Date().toISOString(), "] Running health checks..."));
                        return [4 /*yield*/, Promise.all([
                                this.checkAPI(),
                                this.checkRedis(),
                                this.checkMongoDB(),
                                this.checkPerformance(),
                            ])];
                    case 1:
                        results = _a.sent();
                        allHealthy = results.every(function (result) { return result; });
                        if (!allHealthy && this.failureCount >= ALERT_THRESHOLD) {
                            console.error("\n\u26A0\uFE0F ALERT: System has failed ".concat(this.failureCount, " consecutive checks"));
                            // Here you could add notification logic (email, SMS, etc.)
                        }
                        console.log("\n[".concat(new Date().toISOString(), "] Health check complete. Status: ").concat(allHealthy ? '✅ Healthy' : '❌ Issues Detected'));
                        return [2 /*return*/];
                }
            });
        });
    };
    DeploymentMonitor.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Starting deployment monitor...');
                        // Run initial check
                        return [4 /*yield*/, this.runChecks()];
                    case 1:
                        // Run initial check
                        _a.sent();
                        // Set up interval for subsequent checks
                        setInterval(function () { return _this.runChecks(); }, CHECK_INTERVAL);
                        return [2 /*return*/];
                }
            });
        });
    };
    return DeploymentMonitor;
}());
// Start monitoring
var monitor = new DeploymentMonitor();
monitor.start().catch(console.error);

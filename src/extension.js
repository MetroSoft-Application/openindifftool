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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
var vscode = require("vscode");
var child_process_1 = require("child_process");
var path = require("path");
var os = require("os");
var fs = require("fs");
/**
 * 拡張機能を有効化する関数
 * @param context 拡張機能のコンテキスト
 */
function activate(context) {
    // Diffツールの設定を更新
    updateDiffToolSetting();
    // コマンドを登録
    context.subscriptions.push(vscode.commands.registerCommand('openindifftool.GetDiff', fileDiff), vscode.commands.registerCommand('openindifftool.GetDiffWithGit', handleOpenWithGit));
}
exports.activate = activate;
/**
 * Diffツールの設定を更新する関数
 */
function updateDiffToolSetting() {
    var diffToolSetting = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
    if (diffToolSetting) {
        vscode.workspace.getConfiguration().update('openindifftool.diffTool', 'WinMergeU.exe', vscode.ConfigurationTarget.Global);
    }
}
/**
 * Gitを使用してDiffを開くコマンドを処理する関数
 * @param resource ソースコントロールリソースの状態
 */
function handleOpenWithGit(resource) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, workspaceFolder, originalFilePath, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!resource) {
                        vscode.window.showErrorMessage('No resource selected'); // リソースが選択されていない場合のエラーメッセージ
                        return [2 /*return*/];
                    }
                    filePath = resource.resourceUri.fsPath;
                    workspaceFolder = (_a = vscode.workspace.getWorkspaceFolder(resource.resourceUri)) === null || _a === void 0 ? void 0 : _a.uri.fsPath;
                    if (!workspaceFolder) {
                        vscode.window.showErrorMessage('No workspace folder found'); // ワークスペースフォルダが見つからない場合のエラーメッセージ
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, getOriginalFilePath(workspaceFolder, filePath)];
                case 2:
                    originalFilePath = _b.sent();
                    return [4 /*yield*/, fileDiff(vscode.Uri.file(originalFilePath), [vscode.Uri.file(originalFilePath), vscode.Uri.file(filePath)])];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    vscode.window.showErrorMessage("Error getting original file: ".concat(error_1.message)); // エラーメッセージの表示
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Gitリポジトリから元のファイルパスを取得する関数
 * @param workspaceFolder ワークスペースフォルダ
 * @param filePath ファイルパス
 * @returns 元のファイルパスを解決するPromise
 */
function getOriginalFilePath(workspaceFolder, filePath) {
    return new Promise(function (resolve, reject) {
        var relativeFilePath = path.relative(workspaceFolder, filePath).replace(/\\/g, '/');
        var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-git-'));
        var originalFilePath = path.join(tempDir, path.basename(filePath));
        var gitCommand = "git show HEAD:\"".concat(relativeFilePath, "\"");
        console.log("Executing: ".concat(gitCommand, " in ").concat(workspaceFolder));
        (0, child_process_1.exec)(gitCommand, { cwd: workspaceFolder }, function (err, stdout, stderr) {
            if (err) {
                console.error("Git show command failed: ".concat(stderr)); // Gitコマンドのエラーハンドリング
                reject(new Error("Git show command failed: ".concat(stderr)));
                return;
            }
            fs.writeFileSync(originalFilePath, stdout); // 元ファイルの内容を書き込み
            resolve(originalFilePath);
        });
    });
}
/**
 * 設定されたDiffツールを使用して2つのファイルを比較する関数
 * @param e ファイルのURI
 * @param list 比較するファイルのURIのリスト
 */
function fileDiff(e, list) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, leftPath, rightPath, diffToolPath, diffProcess;
        return __generator(this, function (_b) {
            if (!list || list.length !== 2) {
                vscode.window.showErrorMessage('Comparison requires exactly 2 files.'); // ファイルリストのバリデーション
                return [2 /*return*/];
            }
            _a = list.map(function (uri) { return uri.fsPath; }), leftPath = _a[0], rightPath = _a[1];
            diffToolPath = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
            if (diffToolPath) {
                diffProcess = (0, child_process_1.spawn)(diffToolPath, [leftPath, rightPath]);
                diffProcess.on('error', function (err) {
                    console.error('Failed to start the diff tool:', err);
                    vscode.window.showErrorMessage("Failed to start the diff tool: ".concat(err.message));
                });
            }
            else {
                vscode.window.showErrorMessage('Diff tool path is not specified in the settings.'); // Diffツールのパスが設定されていない場合のエラーメッセージ
            }
            return [2 /*return*/];
        });
    });
}
/**
 * 拡張機能を無効化する関数
 */
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
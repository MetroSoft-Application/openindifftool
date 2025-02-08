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
var path = require("path");
var os = require("os");
var fs = require("fs");
var cp = require("child_process");
// グローバル変数として最初に選択されたタブのURIを保持する
var firstSelectedTabUri = null;
// 一時ファイルのパスを保持する配列
var tempFiles = [];
// 一時ファイルディレクトリの命名の統一
var TEMP_DIR_PREFIX = 'vscode-difftool-';
/**
 * 拡張機能を有効化する関数
 * @param context 拡張機能のコンテキスト
 */
function activate(context) {
    // Diffツールの設定を更新
    updateDiffToolSetting();
    // コマンドを登録
    context.subscriptions.push(vscode.commands.registerCommand('openindifftool.GetDiff', fileDiff), vscode.commands.registerCommand('openindifftool.GetDiffWithScm', handleOpenWithGit), vscode.commands.registerCommand('openindifftool.GetDiffFromEditorTab', handleOpenFromEditorTab), vscode.commands.registerCommand('openindifftool.GetDiffFromSelectedText', handleOpenFromSelectedText));
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
        var filePath, workspaceFolder, scmFolder, originalFilePath, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!resource) {
                        vscode.window.showErrorMessage('No resource selected');
                        return [2 /*return*/];
                    }
                    filePath = resource.resourceUri.fsPath;
                    workspaceFolder = (_a = vscode.workspace.getWorkspaceFolder(resource.resourceUri)) === null || _a === void 0 ? void 0 : _a.uri.fsPath;
                    if (!workspaceFolder) {
                        vscode.window.showErrorMessage('No workspace folder found');
                        return [2 /*return*/];
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, findSCMFolder(filePath)];
                case 2:
                    scmFolder = _b.sent();
                    return [4 /*yield*/, getOriginalFilePath(scmFolder, filePath)];
                case 3:
                    originalFilePath = _b.sent();
                    return [4 /*yield*/, fileDiff(vscode.Uri.file(originalFilePath), [vscode.Uri.file(originalFilePath), vscode.Uri.file(filePath)])];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    vscode.window.showErrorMessage("Error getting original file: ".concat(error_1.message));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
/**
 * エディタタブのコンテキストメニューからコマンドを処理する関数
 * @param {vscode.Uri} uri - 選択されたタブのURI
 */
function handleOpenFromEditorTab(uri) {
    return __awaiter(this, void 0, void 0, function () {
        var tempFilePath, secondSelectedTabUri, uris;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!!firstSelectedTabUri) return [3 /*break*/, 2];
                    return [4 /*yield*/, getOrSaveFileUri(uri)];
                case 1:
                    // 最初の選択を保持する
                    firstSelectedTabUri = _a.sent();
                    tempFilePath = tempFiles.length > 0 ? tempFiles[tempFiles.length - 1] : firstSelectedTabUri.fsPath;
                    vscode.window.showInformationMessage("First file selected: ".concat(tempFilePath, "."));
                    return [3 /*break*/, 5];
                case 2: return [4 /*yield*/, getOrSaveFileUri(uri)];
                case 3:
                    secondSelectedTabUri = _a.sent();
                    uris = [firstSelectedTabUri, secondSelectedTabUri];
                    return [4 /*yield*/, fileDiff(vscode.Uri.file(firstSelectedTabUri.fsPath), uris)];
                case 4:
                    _a.sent();
                    // 比較が完了したらリセット
                    firstSelectedTabUri = null;
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * エディタのコンテキストメニューからコマンドを処理する関数
 * 選択したテキストを一時ファイルに保存して比較を行う
 */
function handleOpenFromSelectedText() {
    return __awaiter(this, void 0, void 0, function () {
        var editor, selection, selectedText, tempDir, tempFilePath, tempUri, uris, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    editor = vscode.window.activeTextEditor;
                    if (!editor) {
                        vscode.window.showErrorMessage('No active editor found');
                        return [2 /*return*/];
                    }
                    selection = editor.selection;
                    selectedText = editor.document.getText(selection);
                    if (!selectedText) {
                        vscode.window.showErrorMessage('No text selected');
                        return [2 /*return*/];
                    }
                    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
                    tempFilePath = path.join(tempDir, "selected-text-".concat(Date.now(), ".txt"));
                    fs.writeFileSync(tempFilePath, selectedText);
                    tempFiles.push(tempFilePath);
                    tempUri = vscode.Uri.file(tempFilePath);
                    if (!!firstSelectedTabUri) return [3 /*break*/, 1];
                    firstSelectedTabUri = tempUri;
                    vscode.window.showInformationMessage("First file selected: ".concat(tempFilePath, "."));
                    return [3 /*break*/, 3];
                case 1:
                    uris = [firstSelectedTabUri, tempUri];
                    return [4 /*yield*/, fileDiff(firstSelectedTabUri, uris)];
                case 2:
                    _a.sent();
                    firstSelectedTabUri = null;
                    _a.label = 3;
                case 3: return [3 /*break*/, 5];
                case 4:
                    error_2 = _a.sent();
                    vscode.window.showErrorMessage("Error: ".concat(error_2.message));
                    deleteTempFiles();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * ファイルが保存されているか確認し、保存されていなければ一時フォルダに保存する関数
 * @param uri ファイルのURI
 * @returns 保存されたファイルのURI
 */
function getOrSaveFileUri(uri) {
    return __awaiter(this, void 0, void 0, function () {
        var document, tempDir, tempFilePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, vscode.workspace.openTextDocument(uri)];
                case 1:
                    document = _a.sent();
                    if (document.isDirty) {
                        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
                        tempFilePath = path.join(tempDir, path.basename(uri.fsPath));
                        fs.writeFileSync(tempFilePath, document.getText());
                        console.log("File saved to: ".concat(tempFilePath));
                        // 一時ファイルのパスを配列に追加
                        tempFiles.push(tempFilePath);
                        return [2 /*return*/, vscode.Uri.file(tempFilePath)];
                    }
                    return [2 /*return*/, uri];
            }
        });
    });
}
/**
 * 一時ファイルを削除する関数
 */
function deleteTempFiles() {
    setTimeout(function () {
        for (var _i = 0, tempFiles_1 = tempFiles; _i < tempFiles_1.length; _i++) {
            var tempFile = tempFiles_1[_i];
            fs.unlinkSync(tempFile);
        }
        tempFiles = [];
    }, 1000);
}
/**
 * SCMフォルダ（.gitまたは.svn）を探す関数
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function findSCMFolder(filePath) {
    return new Promise(function (resolve, reject) {
        var currentDir = filePath;
        while (currentDir) {
            if (fs.existsSync(path.join(currentDir, '.git'))) {
                return resolve(currentDir);
            }
            if (fs.existsSync(path.join(currentDir, '.svn'))) {
                return resolve(currentDir);
            }
            var parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break;
            }
            currentDir = parentDir;
        }
        return reject(new Error('SCMフォルダが見つかりません'));
    });
}
/**
 * SCMリポジトリ（GitまたはSVN）から元のファイルを取得する関数
 * @param {string} scmFolder
 * @param {string} filePath
 * @returns {Promise<string>}
 */
function getOriginalFilePath(scmFolder, filePath) {
    return new Promise(function (resolve, reject) {
        var relativeFilePath = path.relative(scmFolder, filePath).replace(/\\/g, '/');
        var tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
        var originalFilePath = path.join(tempDir, path.basename(filePath));
        isGitRepo(scmFolder).then(function (isGit) {
            if (isGit) {
                var gitCommand = "git show HEAD:\"".concat(relativeFilePath, "\"");
                console.log("Executing: ".concat(gitCommand, " in ").concat(scmFolder));
                cp.exec(gitCommand, { cwd: scmFolder }, function (err, stdout, stderr) {
                    if (err) {
                        console.error("Git show command failed: ".concat(stderr));
                        reject(new Error("Git show command failed: ".concat(stderr)));
                        return;
                    }
                    fs.writeFileSync(originalFilePath, stdout);
                    resolve(originalFilePath);
                });
            }
            else {
                var svnCommand = "svn cat \"".concat(relativeFilePath, "\"");
                console.log("Executing: ".concat(svnCommand, " in ").concat(scmFolder));
                cp.exec(svnCommand, { cwd: scmFolder }, function (err, stdout, stderr) {
                    if (err) {
                        console.error("SVN cat command failed: ".concat(stderr));
                        reject(new Error("SVN cat command failed: ".concat(stderr)));
                        return;
                    }
                    fs.writeFileSync(originalFilePath, stdout);
                    resolve(originalFilePath);
                });
            }
        }).catch(function (error) {
            reject(error);
        });
    });
}
/**
 * Gitリポジトリかどうかを判定する関数
 * @param {string} scmFolder
 * @returns {Promise<boolean>}
 */
function isGitRepo(scmFolder) {
    return new Promise(function (resolve, reject) {
        cp.exec('git rev-parse --is-inside-work-tree', { cwd: scmFolder }, function (err) {
            if (err) {
                resolve(false);
            }
            else {
                resolve(true);
            }
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
                // ファイルリストのバリデーション
                vscode.window.showErrorMessage('Comparison requires exactly 2 files.');
                return [2 /*return*/];
            }
            _a = list.map(function (uri) { return uri.fsPath; }), leftPath = _a[0], rightPath = _a[1];
            diffToolPath = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
            if (diffToolPath) {
                diffProcess = cp.spawn(diffToolPath, [leftPath, rightPath]);
                diffProcess.on('close', function () {
                    // Diffツールのプロセスが終了したときに一時ファイルを削除
                    deleteTempFiles();
                });
                diffProcess.on('error', function (err) {
                    console.error('Failed to start the diff tool:', err);
                    vscode.window.showErrorMessage("Failed to start the diff tool: ".concat(err.message));
                });
            }
            else {
                // Diffツールのパスが設定されていない場合のエラーメッセージ
                vscode.window.showErrorMessage('Diff tool path is not specified in the settings.');
            }
            return [2 /*return*/];
        });
    });
}
/**
 * 拡張機能を無効化する関数
 */
function deactivate() {
    deleteTempFiles();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map
import * as vscode from 'vscode';
import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as cp from 'child_process';

// グローバル変数として最初に選択されたタブのURIを保持する
let firstSelectedTabUri: vscode.Uri | null = null;
// 一時ファイルのパスを保持する配列
let tempFiles: string[] = [];

/**
 * 拡張機能を有効化する関数
 * @param context 拡張機能のコンテキスト
 */
export function activate(context: vscode.ExtensionContext) {
	// Diffツールの設定を更新
	updateDiffToolSetting();

	// コマンドを登録
	context.subscriptions.push(
		vscode.commands.registerCommand('openindifftool.GetDiff', fileDiff),
		vscode.commands.registerCommand('openindifftool.GetDiffWithScm', handleOpenWithGit),
		vscode.commands.registerCommand('openindifftool.GetDiffFromEditorTab', handleOpenFromEditorTab)
	);
}

/**
 * Diffツールの設定を更新する関数
 */
function updateDiffToolSetting() {
	const diffToolSetting = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
	if (diffToolSetting) {
		vscode.workspace.getConfiguration().update('openindifftool.diffTool', 'WinMergeU.exe', vscode.ConfigurationTarget.Global);
	}
}

/**
 * Gitを使用してDiffを開くコマンドを処理する関数
 * @param resource ソースコントロールリソースの状態
 */
async function handleOpenWithGit(resource: vscode.SourceControlResourceState) {
	if (!resource) {
		vscode.window.showErrorMessage('No resource selected');
		return;
	}

	const { fsPath: filePath } = resource.resourceUri;
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource.resourceUri)?.uri.fsPath;

	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found');
		return;
	}

	try {
		const scmFolder = await findSCMFolder(filePath);
		const originalFilePath = await getOriginalFilePath(scmFolder, filePath);
		await fileDiff(vscode.Uri.file(originalFilePath), [vscode.Uri.file(originalFilePath), vscode.Uri.file(filePath)]);
	} catch (error) {
		vscode.window.showErrorMessage(`Error getting original file: ${(error as Error).message}`);
	}
}

/**
 * エディタタブのコンテキストメニューからコマンドを処理する関数
 * @param {vscode.Uri} uri - 選択されたタブのURI
 */
async function handleOpenFromEditorTab(uri: vscode.Uri) {
	if (!firstSelectedTabUri) {
		// 最初の選択を保持する
		firstSelectedTabUri = await getOrSaveFileUri(uri);
		vscode.window.showInformationMessage(`First file selected: ${firstSelectedTabUri.fsPath}.`);
	} else {
		// 2回目の選択で比較を行う
		const secondSelectedTabUri = await getOrSaveFileUri(uri);
		const uris = [firstSelectedTabUri, secondSelectedTabUri];
		await fileDiff(vscode.Uri.file(firstSelectedTabUri.fsPath), uris);

		// 比較が完了したらリセット
		firstSelectedTabUri = null;
	}
}

/**
 * ファイルが保存されているか確認し、保存されていなければ一時フォルダに保存する関数
 * @param uri ファイルのURI
 * @returns 保存されたファイルのURI
 */
async function getOrSaveFileUri(uri: vscode.Uri): Promise<vscode.Uri> {
	const document = await vscode.workspace.openTextDocument(uri);
	if (document.isDirty) {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-'));
		const tempFilePath = path.join(tempDir, path.basename(uri.fsPath));
		fs.writeFileSync(tempFilePath, document.getText());
		// 一時ファイルのパスを配列に追加
		tempFiles.push(tempFilePath);
		return vscode.Uri.file(tempFilePath);
	}
	return uri;
}

/**
 * 一時ファイルを削除する関数
 */
function deleteTempFiles() {
	setTimeout(() => {
		for (const tempFile of tempFiles) {
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
function findSCMFolder(filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		let currentDir = filePath;

		while (currentDir) {
			if (fs.existsSync(path.join(currentDir, '.git'))) {
				return resolve(currentDir);
			}
			if (fs.existsSync(path.join(currentDir, '.svn'))) {
				return resolve(currentDir);
			}
			const parentDir = path.dirname(currentDir);
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
function getOriginalFilePath(scmFolder: string, filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const relativeFilePath = path.relative(scmFolder, filePath).replace(/\\/g, '/');
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-scm-'));
		const originalFilePath = path.join(tempDir, path.basename(filePath));

		isGitRepo(scmFolder).then((isGit) => {
			if (isGit) {
				const gitCommand = `git show HEAD:"${relativeFilePath}"`;
				console.log(`Executing: ${gitCommand} in ${scmFolder}`);

				cp.exec(gitCommand, { cwd: scmFolder }, (err, stdout, stderr) => {
					if (err) {
						console.error(`Git show command failed: ${stderr}`);
						reject(new Error(`Git show command failed: ${stderr}`));
						return;
					}

					fs.writeFileSync(originalFilePath, stdout);
					resolve(originalFilePath);
				});
			} else {
				const svnCommand = `svn cat "${relativeFilePath}"`;
				console.log(`Executing: ${svnCommand} in ${scmFolder}`);

				cp.exec(svnCommand, { cwd: scmFolder }, (err, stdout, stderr) => {
					if (err) {
						console.error(`SVN cat command failed: ${stderr}`);
						reject(new Error(`SVN cat command failed: ${stderr}`));
						return;
					}

					fs.writeFileSync(originalFilePath, stdout);
					resolve(originalFilePath);
				});
			}
		}).catch((error) => {
			reject(error);
		});
	});
}

/**
 * Gitリポジトリかどうかを判定する関数
 * @param {string} scmFolder
 * @returns {Promise<boolean>}
 */
function isGitRepo(scmFolder: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		cp.exec('git rev-parse --is-inside-work-tree', { cwd: scmFolder }, (err) => {
			if (err) {
				resolve(false);
			} else {
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
async function fileDiff(e: vscode.Uri, list?: vscode.Uri[]) {
	if (!list || list.length !== 2) {
		// ファイルリストのバリデーション
		vscode.window.showErrorMessage('Comparison requires exactly 2 files.');
		return;
	}

	const [leftPath, rightPath] = list.map(uri => uri.fsPath);
	const diffToolPath: string | undefined = vscode.workspace.getConfiguration().get('openindifftool.diffTool');

	if (diffToolPath) {
		// Diffツールを実行
		const diffProcess = spawn(diffToolPath, [leftPath, rightPath]);
		diffProcess.on('close', () => {
			// Diffツールのプロセスが終了したときに一時ファイルを削除
			deleteTempFiles();
		});
		diffProcess.on('error', (err: { message: string; }) => {
			console.error('Failed to start the diff tool:', err);
			vscode.window.showErrorMessage(`Failed to start the diff tool: ${err.message}`);
		});
	} else {
		// Diffツールのパスが設定されていない場合のエラーメッセージ
		vscode.window.showErrorMessage('Diff tool path is not specified in the settings.');
	}
}

/**
 * 拡張機能を無効化する関数
 */
export function deactivate() { }

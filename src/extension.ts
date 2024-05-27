import * as vscode from 'vscode';
import { spawn, exec } from 'child_process';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

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
		vscode.commands.registerCommand('openindifftool.GetDiffWithScm', handleOpenWithGit)
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
		vscode.window.showErrorMessage('No resource selected'); // リソースが選択されていない場合のエラーメッセージ
		return;
	}

	const { fsPath: filePath } = resource.resourceUri;
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(resource.resourceUri)?.uri.fsPath;

	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found'); // ワークスペースフォルダが見つからない場合のエラーメッセージ
		return;
	}

	try {
		const originalFilePath = await getOriginalFilePath(workspaceFolder, filePath);
		await fileDiff(vscode.Uri.file(originalFilePath), [vscode.Uri.file(originalFilePath), vscode.Uri.file(filePath)]);
	} catch (error) {
		vscode.window.showErrorMessage(`Error getting original file: ${(error as Error).message}`); // エラーメッセージの表示
	}
}

/**
 * Gitリポジトリから元のファイルパスを取得する関数
 * @param workspaceFolder ワークスペースフォルダ
 * @param filePath ファイルパス
 * @returns 元のファイルパスを解決するPromise
 */
function getOriginalFilePath(workspaceFolder: string, filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const relativeFilePath = path.relative(workspaceFolder, filePath).replace(/\\/g, '/');
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-scm-'));
		const originalFilePath = path.join(tempDir, path.basename(filePath));

		isGitRepo(workspaceFolder).then((isGit) => {
			if (isGit) {
				const gitCommand = `git show HEAD:"${relativeFilePath}"`;
				console.log(`Executing: ${gitCommand} in ${workspaceFolder}`);

				exec(gitCommand, { cwd: workspaceFolder }, (err, stdout, stderr) => {
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
				console.log(`Executing: ${svnCommand} in ${workspaceFolder}`);

				exec(svnCommand, { cwd: workspaceFolder }, (err, stdout, stderr) => {
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
 * Gitリポジトリであるかを判定する関数
 * @param workspaceFolder ワークスペースフォルダ
 */
function isGitRepo(workspaceFolder: string): Promise<boolean> {
	return new Promise((resolve, reject) => {
		exec('git rev-parse --is-inside-work-tree', { cwd: workspaceFolder }, (err) => {
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
		vscode.window.showErrorMessage('Comparison requires exactly 2 files.'); // ファイルリストのバリデーション
		return;
	}

	const [leftPath, rightPath] = list.map(uri => uri.fsPath);
	const diffToolPath: string | undefined = vscode.workspace.getConfiguration().get('openindifftool.diffTool');

	if (diffToolPath) {
		const diffProcess = spawn(diffToolPath, [leftPath, rightPath]); // Diffツールを実行
		diffProcess.on('error', (err: { message: string; }) => {
			console.error('Failed to start the diff tool:', err);
			vscode.window.showErrorMessage(`Failed to start the diff tool: ${err.message}`);
		});
	} else {
		vscode.window.showErrorMessage('Diff tool path is not specified in the settings.'); // Diffツールのパスが設定されていない場合のエラーメッセージ
	}
}

/**
 * 拡張機能を無効化する関数
 */
export function deactivate() { }

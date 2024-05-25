import * as vscode from 'vscode';
const { spawn } = require('child_process');
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as cp from 'child_process';

export function activate(context: vscode.ExtensionContext) {
	const diffToolSetting = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
	if (diffToolSetting) {
		vscode.workspace.getConfiguration().update('openindifftool.diffTool', 'WinMergeU.exe', vscode.ConfigurationTarget.Global);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand('openindifftool.GetDiff', fileDiff),
	);
	context.subscriptions.push(
		vscode.commands.registerCommand('openindifftool.GetDiffWithGit', handleOpenWithGit),
	);
}

async function handleOpenWithGit(resource: vscode.SourceControlResourceState) {
	if (!resource) {
		vscode.window.showErrorMessage('No resource selected');
		return;
	}

	const uri = resource.resourceUri;
	const filePath = uri.fsPath;
	const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;

	if (!workspaceFolder) {
		vscode.window.showErrorMessage('No workspace folder found');
		return;
	}

	try {
		const originalFilePath = await getOriginalFilePath(workspaceFolder, filePath);
		await fileDiff(vscode.Uri.file(originalFilePath), [vscode.Uri.file(originalFilePath), vscode.Uri.file(filePath)]);
	} catch (error: any) {
		vscode.window.showErrorMessage(`Error getting original file: ${error.message}`);
	}
}

function getOriginalFilePath(workspaceFolder: string, filePath: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const relativeFilePath = path.relative(workspaceFolder, filePath).replace(/\\/g, '/');
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vscode-git-'));
		const originalFilePath = path.join(tempDir, path.basename(filePath));

		const gitCommand = `git show HEAD:"${relativeFilePath}"`;
		console.log(`Executing: ${gitCommand} in ${workspaceFolder}`);

		cp.exec(gitCommand, { cwd: workspaceFolder }, (err, stdout, stderr) => {
			if (err) {
				console.error(`Git show command failed: ${stderr}`);
				reject(new Error(`Git show command failed: ${stderr}`));
				return;
			}

			fs.writeFileSync(originalFilePath, stdout);
			resolve(originalFilePath);
		});
	});
}


async function fileDiff(e: vscode.Uri, list?: vscode.Uri[]) {
	let leftPath, rightPath;
	if (list && list.length > 1) {
		if (list.length > 2) {
			vscode.window.showErrorMessage('Comparison of more than 2 files is not supported.');
			return;
		}
		[leftPath, rightPath] = list.map((p) => p.fsPath);
	}

	if (leftPath && rightPath) {
		const diffToolPath: string | undefined = vscode.workspace.getConfiguration().get('openindifftool.diffTool');
		if (diffToolPath) {
			const diffProcess = spawn(diffToolPath, [leftPath, rightPath]);
			diffProcess.on('error', (err: { message: any; }) => {
				console.error('Failed to start the diff tool:', err);
				vscode.window.showErrorMessage(`Failed to start the diff tool: ${err.message}`);
			});
		} else {
			vscode.window.showErrorMessage('Diff tool path is not specified in the settings.');
		}
	}
}

export function deactivate() { }
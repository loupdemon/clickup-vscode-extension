import * as vscode from 'vscode';
import * as path from 'path';
import { WebviewHelper } from '../webviewHelper';
import { Member, Statuses, Task, Tag, Priority, Status } from '../../types';

export class EditWebview {
	context: vscode.ExtensionContext;
	panel: vscode.WebviewPanel;
	webviewhelper: WebviewHelper;
	htmlFile: string;

	dependecies: any;
	statuses: Status;

	constructor(context: vscode.ExtensionContext, task: Task, args: any) {
		this.context = context;
		this.htmlFile = path.join(context.extensionPath, 'src', 'web_view', 'edit', 'index.html');
		this.statuses = args.statuses;

		this.dependecies = {
			bootstrapSrc: path.join(context.extensionPath, 'node_modules', 'bootstrap', 'dist', 'css', 'bootstrap.min.css'),
			vueSrc: path.join(context.extensionPath, 'node_modules', 'vue', 'dist', 'vue.global.js'),
			tagifySrc: path.join(context.extensionPath, 'node_modules', '@yaireo', 'tagify', 'dist', 'tagify.min.js'),
			tagifyCssSrc: path.join(context.extensionPath, 'node_modules', '@yaireo', 'tagify', 'dist', 'tagify.css'),
			vueApp: path.join(context.extensionPath, 'src', 'web_view', 'edit', 'script.js'),
		};

		this.panel = vscode.window.createWebviewPanel(
			'editTask',
			task.name,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [
					vscode.Uri.file(path.join(context.extensionPath, 'src', 'web_view')),
					vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))
				]
			}
		);

		this.webviewhelper = new WebviewHelper(context, this.panel, this.htmlFile);
		this.webviewhelper.getPanel(this.dependecies)
			.then(async (panel) => {
				this.panel = panel as vscode.WebviewPanel;
				this.panel.webview.postMessage({
					command: 'init',
					data: {
						task: task,
						members: this.filterMembers(args.members),
						statuses: this.filterStatuses(args.statuses),
						tags: this.filterTags(args.tags),
						priorities: this.filterPriorities(args.priorities)
					}
				});

				this.panel.webview.onDidReceiveMessage(
					async message => {
						switch (message.command) {
							case 'getMembers':
								this.panel.webview.postMessage({
									command: message.command,
									data: args.members
								});
								return;
							case "error":
								vscode.window.showErrorMessage(message.args);
								break;
							case "updateTask":
								//TODO: update only edited fields
								var response = await args.wrapper.updateTask(message.args.id, {
									name: message.args.name,
									description: message.args.description,
									status: message.args.status.name
								});


								if (response) {
									vscode.window.showInformationMessage('Task updated');
								}
								break;
						}
					},
					undefined,
					context.subscriptions
				);
			});
	}

	private filterMembers(members: Array<Member>) {
		var result: Array<any> = [];
		for (var member of members) {
			result.push({
				id: member.id,
				value: member.username,
				name: member.username
			});
		}

		return result;
	}

	private filterStatuses(statuses: Array<Statuses>) {
		var result: Array<any> = [];
		for (var status of statuses) {
			result.push({
				id: status.id,
				value: status.status,
				name: status.status
			});
		}

		return result;
	}

	private findStatuses(id: String) {
		return Object(this.statuses).find((status: any) => status.id === id);
	}

	private filterTags(tags: Array<Tag>) {
		var result: Array<any> = [];
		for (var tag of tags) {
			result.push({
				value: tag.name,
				name: tag.name
			});
		}

		return result;
	}

	private filterPriorities(priorities: Array<Priority>) {
		var result: Array<any> = [];
		for (var priority of priorities) {
			result.push({
				id: priority.id,
				value: priority.priority,
				name: priority.priority
			});
		}

		return result;
	}



}
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./media/scmViewPaneContainer';
import { localize } from 'vs/nls';
import { Event } from 'vs/base/common/event';
import { ITelemetryService } from 'vs/platform/telemetry/common/telemetry';
import { VIEWLET_ID, ISCMService, ISCMRepository } from 'vs/workbench/contrib/scm/common/scm';
import { IInstantiationService } from 'vs/platform/instantiation/common/instantiation';
import { IContextViewService, IContextMenuService } from 'vs/platform/contextview/browser/contextView';
import { ICommandService } from 'vs/platform/commands/common/commands';
import { IKeybindingService } from 'vs/platform/keybinding/common/keybinding';
import { MenuItemAction } from 'vs/platform/actions/common/actions';
import { IAction, IActionViewItem } from 'vs/base/common/actions';
import { ContextAwareMenuEntryActionViewItem } from 'vs/platform/actions/browser/menuEntryActionViewItem';
import { SCMMenus } from './menus';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import { IStorageService } from 'vs/platform/storage/common/storage';
import { IConfigurationService } from 'vs/platform/configuration/common/configuration';
import { INotificationService } from 'vs/platform/notification/common/notification';
import { IWorkbenchLayoutService } from 'vs/workbench/services/layout/browser/layoutService';
import { IExtensionService } from 'vs/workbench/services/extensions/common/extensions';
import { IWorkspaceContextService } from 'vs/platform/workspace/common/workspace';
import { IViewDescriptorService } from 'vs/workbench/common/views';
import { SCMViewPane } from 'vs/workbench/contrib/scm/browser/scmViewPane';
import { ViewPaneContainer } from 'vs/workbench/browser/parts/views/viewPaneContainer';
import { addClass } from 'vs/base/browser/dom';

export class SCMViewPaneContainer extends ViewPaneContainer {

	private menus: SCMMenus;
	private _repositories: ISCMRepository[] = [];

	private _height: number | undefined = undefined;
	get height(): number | undefined { return this._height; }

	get repositories(): ISCMRepository[] {
		return this._repositories;
	}

	get visibleRepositories(): ISCMRepository[] {
		return this.panes.filter(pane => pane instanceof SCMViewPane)
			.map(pane => (pane as SCMViewPane).repository);
	}

	get onDidChangeVisibleRepositories(): Event<ISCMRepository[]> {
		const modificationEvent = Event.debounce(Event.any(this.viewContainerModel.onDidAddVisibleViewDescriptors, this.viewContainerModel.onDidRemoveVisibleViewDescriptors), () => null, 0);
		return Event.map(modificationEvent, () => this.visibleRepositories);
	}

	constructor(
		@IWorkbenchLayoutService layoutService: IWorkbenchLayoutService,
		@ITelemetryService telemetryService: ITelemetryService,
		@ISCMService protected scmService: ISCMService,
		@IInstantiationService protected instantiationService: IInstantiationService,
		@IContextViewService protected contextViewService: IContextViewService,
		@IKeybindingService protected keybindingService: IKeybindingService,
		@INotificationService protected notificationService: INotificationService,
		@IContextMenuService protected contextMenuService: IContextMenuService,
		@IThemeService protected themeService: IThemeService,
		@ICommandService protected commandService: ICommandService,
		@IStorageService storageService: IStorageService,
		@IConfigurationService configurationService: IConfigurationService,
		@IExtensionService extensionService: IExtensionService,
		@IWorkspaceContextService protected contextService: IWorkspaceContextService,
		@IViewDescriptorService viewDescriptorService: IViewDescriptorService
	) {
		super(VIEWLET_ID, { mergeViewWithContainerWhenSingleView: true }, instantiationService, configurationService, layoutService, contextMenuService, telemetryService, extensionService, themeService, storageService, contextService, viewDescriptorService);

		this.menus = instantiationService.createInstance(SCMMenus, undefined);
		this._register(this.menus.onDidChangeTitle(this.updateTitleArea, this));
	}

	create(parent: HTMLElement): void {
		super.create(parent);
		addClass(parent, 'scm-viewlet');
	}

	// focus(): void {
	// 	const repository = this.visibleRepositories[0];

	// 	if (repository) {
	// 		const pane = this.panes
	// 			.filter(pane => pane instanceof SCMViewPane && pane.repository === repository)[0] as SCMViewPane | undefined;

	// 		if (pane) {
	// 			pane.focus();
	// 		} else {
	// 			super.focus();
	// 		}
	// 	} else {
	// 		super.focus();
	// 	}
	// }

	getOptimalWidth(): number {
		return 400;
	}

	getTitle(): string {
		const title = localize('source control', "Source Control");

		if (this.visibleRepositories.length === 1) {
			const [repository] = this.repositories;
			return localize('viewletTitle', "{0}: {1}", title, repository.provider.label);
		} else {
			return title;
		}
	}

	getActionViewItem(action: IAction): IActionViewItem | undefined {
		if (!(action instanceof MenuItemAction)) {
			return undefined;
		}

		return new ContextAwareMenuEntryActionViewItem(action, this.keybindingService, this.notificationService, this.contextMenuService);
	}

	getActions(): IAction[] {
		if (this.repositories.length > 0) {
			return super.getActions();
		}

		return this.menus.getTitleActions();
	}

	getSecondaryActions(): IAction[] {
		if (this.repositories.length > 0) {
			return super.getSecondaryActions();
		}

		return this.menus.getTitleSecondaryActions();
	}

	getActionsContext(): any {
		if (this.visibleRepositories.length === 1) {
			return this.repositories[0].provider;
		}
	}
}
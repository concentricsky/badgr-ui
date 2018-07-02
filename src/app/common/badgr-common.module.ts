import { ModuleWithProviders, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpModule } from "@angular/http";
import { RouterModule } from "@angular/router";

import { BgAwaitPromises } from "./directives/bg-await-promises";
import { BgImageStatusPlaceholderDirective } from "./directives/bg-image-status-placeholder.directive";
import { MenuItemDirective } from "./directives/bg-menuitem.directive";
import { ScrollPinDirective } from "./directives/scroll-pin.directive";
import { BadgeImageComponent } from "./components/badge-image.component";
import { ConfirmDialog } from "./dialogs/confirm-dialog.component";
import { NewTermsDialog } from "./dialogs/new-terms-dialog.component";
import { ConnectedBadgeComponent } from "./components/connected-badge.component";
import { TruncatedTextComponent } from "./components/truncated-text.component";
import { TooltipComponent } from "./components/tooltip.component";

import { FormMessageComponent } from "./components/form-message.component";
import { FormFieldText } from "./components/formfield-text";
import { FormFieldMarkdown } from "./components/formfield-markdown";
import { FormFieldSelect } from "./components/formfield-select";
import { LoadingDotsComponent } from "./components/loading-dots.component";
import { LoadingErrorComponent } from "./components/loading-error.component";
import { BgIssuerLinkComponent } from "./components/issuer-link.component";
import { BgFormFieldImageComponent } from "./components/formfield-image";
import { BgFormFieldFileComponent } from "./components/formfield-file";
import { CommonDialogsService } from "./services/common-dialogs.service";
import { CommonEntityManager } from "../entity-manager/common-entity-manager.service";
import { SystemConfigService } from "./services/config.service";
import { SessionService } from "./services/session.service";
import { MessageService } from "./services/message.service";
import { SettingsService } from "./services/settings.service";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { UcFirstPipe } from "./pipes/ucfirst.pipe";

import { MarkdownToHtmlModule } from "markdown-to-html-pipe";
import { Autosize } from "angular2-autosize/src/autosize.directive";
//import { TooltipDirective } from "./directives/tooltip.directive";
import { BgCopyInputDirective } from "./directives/bg-copy-input.directive";
import { ShareSocialDialog } from "./dialogs/share-social-dialog.component";
import { TimeComponent } from "./components/time.component";
import { BadgrButtonComponent } from "./components/badgr-button.component";
import { SharingService } from "./services/sharing.service";
import { EventsService } from "./services/events.service";
import { ForwardRouteComponent } from "./pages/forward-route.component";
import { MarkdownDisplay } from "./components/markdown-display";
import { ShowMore } from "./components/show-more.component";
import { QueryParametersService } from "./services/query-parameters.service";
import { UserProfileManager } from "./services/user-profile-manager.service";
import { UserProfileApiService } from "./services/user-profile-api.service";
import { OAuthApiService } from "./services/oauth-api.service";
import { OAuthManager } from "./services/oauth-manager.service";
import { AuthGuard } from "./guards/auth.guard";
import { OAuthBannerComponent } from "./components/oauth-banner.component";
import { EmbedService } from "./services/embed.service";
import { InitialLoadingIndicatorService } from "./services/initial-loading-indicator.service";
import {ExternalToolsManager} from "../externaltools/services/externaltools-manager.service";
import {ExternalToolsApiService} from "../externaltools/services/externaltools-api.service";
import {ExternalToolLaunchComponent} from "./components/external-tool-launch.component";


const DIRECTIVES = [
	BgAwaitPromises,
	BgImageStatusPlaceholderDirective,
	MenuItemDirective,
	ScrollPinDirective,
	BgCopyInputDirective,
	Autosize,
	//TooltipDirective,
];

const COMPONENTS = [
	BadgeImageComponent,
	ConfirmDialog,
	NewTermsDialog,
	ShareSocialDialog,
	ConnectedBadgeComponent,
	TruncatedTextComponent,
	FormMessageComponent,
	FormFieldText,
	FormFieldMarkdown,
	FormFieldSelect,
	LoadingDotsComponent,
	LoadingErrorComponent,
	BgIssuerLinkComponent,
	BgFormFieldImageComponent,
	BgFormFieldFileComponent,
	TimeComponent,
	BadgrButtonComponent,
	TooltipComponent,
	MarkdownDisplay,
	ShowMore,
	OAuthBannerComponent,
	ExternalToolLaunchComponent
];

const SERVICES = [
	CommonDialogsService,
	CommonEntityManager,
	SystemConfigService,
	MessageService,
	SettingsService,
	SharingService,
	EventsService,
	SessionService,
	QueryParametersService,
	UserProfileManager,
	UserProfileApiService,
	OAuthManager,
	OAuthApiService,
	EmbedService,
	InitialLoadingIndicatorService,
	ExternalToolsApiService,
	ExternalToolsManager
];

const GUARDS = [
	AuthGuard
];

const PIPES = [
	UcFirstPipe
];

export const COMMON_IMPORTS = [
	CommonModule,
	FormsModule,
	ReactiveFormsModule,
	HttpModule,
	RouterModule,
];

@NgModule({
	imports: [
		...COMMON_IMPORTS,
		MarkdownToHtmlModule
		//RouterModule.forChild(routes)
	],
	declarations: [
		...DIRECTIVES,
		...COMPONENTS,
		...PIPES,
		ForwardRouteComponent
	],
	exports: [
		...DIRECTIVES,
		...COMPONENTS,
		...PIPES,
	],
	entryComponents: [
		// Allows the dynamic creation of our components using the ComponentFactoryProvider. This is used in structural
		// directives like BgAwaitPromises. See https://github.com/angular/angular/issues/10735 for details.
		...COMPONENTS
	],
	/*providers: [
		...SERVICES,
	]*/
})
export class BadgrCommonModule {
	// Load BadgrCommonModule with forRoot() to preserve singleton status in lazy loaded modules.
	// see: https://www.youtube.com/watch?v=SBSnsNHQYo4
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: BadgrCommonModule,
			providers: [
				...SERVICES,
				...GUARDS
			]
		}
	}
}

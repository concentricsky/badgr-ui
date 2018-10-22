import { Component, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";

import { Angulartics2GoogleAnalytics } from "angulartics2";
import { Angulartics2 } from "angulartics2";

import { MessageService } from "./common/services/message.service";
import { SessionService } from "./common/services/session.service";
import { CommonDialogsService } from "./common/services/common-dialogs.service";
import { SystemConfigService } from "./common/services/config.service";
import { ShareSocialDialog } from "./common/dialogs/share-social-dialog.component";
import { ConfirmDialog } from "./common/dialogs/confirm-dialog.component";

import "../thirdparty/scopedQuerySelectorShim";

// Shim in support for the :scope attribute
// See https://github.com/lazd/scopedQuerySelectorShim and
// https://stackoverflow.com/questions/3680876/using-queryselectorall-to-retrieve-direct-children/21126966#21126966

@Component({
	selector: "initial-redirect",
	template: ``
})
export class InitialRedirectComponent {
	constructor(
		private sessionService: SessionService,
		private router: Router
	) {
		if (sessionService.isLoggedIn) {
			router.navigate(['/recipient/badges'], { replaceUrl: true });
		} else {
			router.navigate(['/auth/login'], { replaceUrl: true });
		}
	}
}

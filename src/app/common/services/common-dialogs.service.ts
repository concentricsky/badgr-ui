import { Injectable } from "@angular/core";
import { ConfirmDialog } from "../dialogs/confirm-dialog.component";
import { ShareSocialDialog } from "../dialogs/share-social-dialog.component";
import {NewTermsDialog} from "../dialogs/new-terms-dialog.component";


@Injectable()
export class CommonDialogsService {
	confirmDialog: ConfirmDialog;
	shareSocialDialog: ShareSocialDialog;
	newTermsDialog: NewTermsDialog;


	constructor(){}

	init(
		confirmDialog: ConfirmDialog,
		shareSocialDialog: ShareSocialDialog,
		newTermsDialog: NewTermsDialog
	) {
		this.confirmDialog = confirmDialog;
		this.shareSocialDialog = shareSocialDialog;
		this.newTermsDialog = newTermsDialog;
	}
}
import { Component, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { MessageService } from "../common/services/message.service";
import { Title } from "@angular/platform-browser";
import { RecipientBadgeSelectionDialog } from "./recipient-badge-selection-dialog.component";
import { RecipientBadgeCollection, RecipientBadgeCollectionEntry } from "./models/recipient-badge-collection.model";
import { RecipientBadgeCollectionManager } from "./services/recipient-badge-collection-manager.service";
import { RecipientBadgeManager } from "./services/recipient-badge-manager.service";
import { CommonDialogsService } from "../common/services/common-dialogs.service";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { SessionService } from "../common/services/session.service";
import { ShareSocialDialogOptions } from "../common/dialogs/share-social-dialog.component";
import { addQueryParamsToUrl } from "../common/util/url-util";


@Component({
	selector: 'recipient-earned-badge-detail',
	template: `
		<main>
			<form-message></form-message>

			<header class="wrap wrap-light l-containerhorizontal l-heading">
				<nav>
					<h1 class="visuallyhidden">Breadcrumbs</h1>
					<ul class="breadcrumb">
						<li><a [routerLink]="['/recipient/badge-collections']">Collections</a></li>
						<li class="breadcrumb-x-current">{{ collection?.name || 'Loading...' }}</li>
					</ul>
				</nav>

				<div class="heading" *bgAwaitPromises="[ collectionLoadedPromise ]">
					<div class="heading-x-text">
						<ng-template [ngIf]="! editForm.isEditing">
							<h1>
								{{ collection.name }}
								<button class="heading-x-edit" type="button" (click)="editForm.startEditing()">Edit</button>
							</h1>
							<p [truncatedText]="collection.description" [maxLength]="100"></p>
							<a class="button button-primaryghost l-offsetleft" (click)="deleteCollection()" [disabled-when-requesting]="true">Delete Collection</a>
						</ng-template>

						<recipient-badge-collection-edit-form [badgeCollection]="collection" #editForm></recipient-badge-collection-edit-form>
					</div>

					<div class="heading-x-actions">
						<button class="button button-major"
						        type="button"
						        [class.button-is-disabled]="! collection.published"
						        [disabled]="! collection.published"
						        (click)="shareCollection()"
						        >Share Collection</button>
						<input class="switch switch-bold" type="checkbox" id="collection-published-switch" [(ngModel)]="collectionPublished">
						<label for="collection-published-switch">
							<span class="switch-x-text">Your collection is </span>
							<span class="switch-x-toggletext">
						    <span class="switch-x-unchecked"><span class="switch-x-hiddenlabel">Unchecked: </span>Private</span>
						    <span class="switch-x-checked"><span class="switch-x-hiddenlabel">Checked: </span>Public</span>
						  </span>
						</label>
					</div>
				</div>
			</header>

			<section class="l-containerhorizontal l-containervertical l-childrenvertical wrap"
			         *bgAwaitPromises="[ collectionLoadedPromise ]"
			>
				<header class="l-childrenhorizontal l-childrenhorizontal-spacebetween l-childrenhorizontal-stackmobile">
					<h1 class="title">{{ badgesInCollectionCount }}</h1>
					<button class="button" type="button" (click)="manageBadges()">Add Badges</button>
				</header>

				<div class="l-overflowhorizontal">

					<table class="table">
						<thead>
							<tr>
								<th scope="col">Badge</th>
								<th class="hidden hidden-is-desktop" scope="col">Issuer</th>
								<th class="hidden hidden-is-desktop" scope="col">Awarded</th>
								<th class="hidden hidden-is-desktop" scope="col"><span class="visuallyhidden">Actions</span></th>
							</tr>
						</thead>
						<tbody>
							<tr *ngFor="let entry of collection.badgeEntries">
								<th>
									<a class="stack stack-list"
										 [routerLink]="['/recipient/earned-badge', entry.badge.slug]">
										<span class="stack-x-image">
											<img [loaded-src]="entry.badge.image"
											     [loading-src]="badgeLoadingImageUrl"
											     [error-src]="badgeFailedImageUrl"
											     width="40" />
										</span>
										<span class="stack-x-text">
											<span class="stack-x-title">{{ entry.badge.badgeClass.name }}</span>
										</span>
									</a>
								</th>
								<td class="hidden hidden-is-desktop" >{{ entry.badge.badgeClass.issuer.name }}</td>
								<td class="hidden hidden-is-desktop" ><time [date]="entry.badge.issueDate" format="longDate"></time></td>
								<td class="hidden hidden-is-desktop">
									<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-right">
										<button class="button button-primaryghost" type="button" (click)="removeEntry(entry)" [disabled-when-requesting]="true">Remove</button>
									</div>
								</td>
							</tr>
						</tbody>
					</table>

				</div>

			</section>

			<recipient-badge-selection-dialog #recipientBadgeDialog></recipient-badge-selection-dialog>
		</main>

		`
})
export class RecipientBadgeCollectionDetailComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly badgeLoadingImageUrl = require('../../breakdown/static/images/badge-loading.svg');
	readonly badgeFailedImageUrl = require('../../breakdown/static/images/badge-failed.svg');

	@ViewChild("recipientBadgeDialog")
	recipientBadgeDialog: RecipientBadgeSelectionDialog;

	collectionLoadedPromise: Promise<any>;
	collection: RecipientBadgeCollection;

	constructor(
		router: Router,
		route: ActivatedRoute,
		loginService: SessionService,
		private title: Title,
		private messageService: MessageService,
		private recipientBadgeManager: RecipientBadgeManager,
		private recipientBadgeCollectionManager: RecipientBadgeCollectionManager,
		private dialogService: CommonDialogsService
	) {
		super(router, route, loginService);

		title.setTitle("Collections - Badgr");

		this.collectionLoadedPromise = Promise.all([
				this.recipientBadgeCollectionManager.recipientBadgeCollectionList.loadedPromise,
				this.recipientBadgeManager.recipientBadgeList.loadedPromise
			])
			.then(([list]) => this.collection = list.entityForSlug(this.collectionSlug))
			.then(collection => collection.badgesPromise)
			.catch(err => this.messageService.reportHandledError(`Failed to load collection ${this.collectionSlug}`));
	}

	get collectionSlug(): string { return this.route.snapshot.params['collectionSlug']; }

	ngOnInit() {
		super.ngOnInit();
	}

	manageBadges() {
		this.recipientBadgeDialog.openDialog({
			dialogId: "manage-collection-badges",
			dialogTitle: "Add Badges",
			multiSelectMode: true,
			restrictToIssuerId: null,
			omittedCollection: this.collection.badges
		}).then(selectedBadges => {
			let  badgeCollection = selectedBadges.concat(this.collection.badges)

			badgeCollection.forEach(badge => badge.markAccepted());

			this.collection.updateBadges(badgeCollection);
			this.collection.save().then(
				success => this.messageService.reportMinorSuccess(`Collection ${this.collection.name} badges saved successfully`),
				failure => this.messageService.reportHandledError(`Failed to save Collection`, failure)
			)
		})
	}

	deleteCollection() {
		this.dialogService.confirmDialog.openResolveRejectDialog({
			dialogTitle: "Delete Collection",
			dialogBody: `Are you sure you want to delete collection ${this.collection.name}?`,
			resolveButtonLabel: "Delete Collection",
			rejectButtonLabel: "Cancel"
		}).then(
			() => {
				this.collection.deleteCollection().then(
					() => {
						this.messageService.reportMinorSuccess(`Deleted collection '${this.collection.name}'`);
						this.router.navigate(['/recipient/badge-collections']);
					},
					error => this.messageService.reportHandledError(`Failed to delete collection`, error)
				);
			},
			() => {}
		)
	}

	removeEntry(entry: RecipientBadgeCollectionEntry) {
		this.dialogService.confirmDialog.openResolveRejectDialog({
			dialogTitle: "Confirm Remove",
			dialogBody: `Are you sure you want to remove ${entry.badge.badgeClass.name} from ${this.collection.name}?`,
			rejectButtonLabel: "Cancel",
			resolveButtonLabel: "Remove Badge"
		}).then(
			() => {
				this.collection.badgeEntries.remove(entry);
				this.collection.save().then(
					success => this.messageService.reportMinorSuccess(`Removed badge ${entry.badge.badgeClass.name} from collection ${this.collection.name} successfully`),
					failure => this.messageService.reportHandledError(`Failed to remove badge ${entry.badge.badgeClass.name} from collection ${this.collection.name}`, failure)
				);
			},
			() => {}
		)
	}

	get badgesInCollectionCount():string{
		return `${this.collection.badgeEntries.length } ${this.collection.badgeEntries.length == 1 ? 'Badge' : 'Badges'}`
	}

	get collectionPublished() {
		return this.collection.published;
	}

	set collectionPublished(published: boolean) {
		this.collection.published = published;

		if (published) {
			this.collection.save().then(
				success => this.messageService.reportMinorSuccess(`Published collection ${this.collection.name} successfully`),
				failure => this.messageService.reportHandledError(`Failed to publish collection ${this.collection.name}`, failure)
			);
		} else {
			this.collection.save().then(
				success => this.messageService.reportMinorSuccess(`Unpublished collection ${this.collection.name} successfully`),
				failure => this.messageService.reportHandledError(`Failed to un-publish collection ${this.collection.name}`, failure)
			);
		}
	}

	shareCollection() {
		this.dialogService.shareSocialDialog.openDialog(shareCollectionDialogOptionsFor(this.collection));
	}
}

export function shareCollectionDialogOptionsFor(collection: RecipientBadgeCollection): ShareSocialDialogOptions {
	return {
		title: "Share Collection",
		shareObjectType: "BadgeCollection",
		shareUrl: collection.shareUrl,
		shareTitle: collection.name,
		shareIdUrl: collection.url,
		shareSummary: collection.description,
		shareEndpoint: "shareArticle",
		excludeServiceTypes: ["Portfolium"],

		embedOptions: [
			{
				label: "Card",
				embedTitle: "Badgr Badge Collection: " + collection.name,
				embedType: "iframe",
				embedSize: { width: 330, height: 186 },
				embedVersion: 1,
				embedUrl: addQueryParamsToUrl(collection.shareUrl, { embed: true }),
				embedLinkUrl: null,
			}
		]
	};
}
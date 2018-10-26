import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { MessageService } from "../common/services/message.service";
import { BaseRoutableComponent } from "../common/pages/base-routable.component";
import { Title } from "@angular/platform-browser";
import { RecipientBadgeCollectionManager } from "./services/recipient-badge-collection-manager.service";
import { RecipientBadgeCollection } from "./models/recipient-badge-collection.model";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { SessionService } from "../common/services/session.service";
import { RecipientBadgeManager } from "./services/recipient-badge-manager.service";
import { CommonDialogsService } from "../common/services/common-dialogs.service";
import { shareCollectionDialogOptionsFor } from "./recipient-badge-collection-detail.component";

@Component({
	selector: 'recipient-badge-collection-list',
	template: `
		<main>
			<form-message></form-message>

			<header class="wrap wrap-light l-containerhorizontal l-heading">

		    <div class="heading">
		        <div class="heading-x-text">
		            <h1>Collections <span>{{ badgeCollections?.length }} Collections</span></h1>
		        </div>
						<div class="heading-x-actions">
							<a class="button button-major"
							   [routerLink]="['/recipient/badge-collections/create']"
							   [disabled-when-requesting]="true"
							>Add Collection</a>
						</div>
		    </div>

		  </header>

			<ng-template [bgAwaitPromises]="[ collectionListLoaded ]">
				<!--  Empty state - collection has not badges -->
				<article *ngIf="badgeCollections.length == 0" class="emptyillustration l-containervertical">
					<h1>You have no Collections</h1>
					<div>Collections are a way to organize badges you've earned to share them together.</div>
					<img [src]="noCollectionsImageUrl" alt="Illustration description">
				</article>
				<!--  Collection of Badges -->
				<div *ngIf="badgeCollections.length > 0" class="l-containerhorizontal l-containervertical l-gridthree wrap">
					<div *ngFor="let collection of badgeCollections">
						<article class="card card-collection">
							<a class="card-x-main" [routerLink]="[ '/recipient/badge-collections/collection', collection.slug ]">
					    <span class="card-x-text">
					      <h1>{{ collection.name }}</h1>
						    <small>{{ collection.badgeEntries.length == 1 ? '1 Badge' : (collection.badgeEntries.length + ' Badges') }}</small>
					      <ul>
					        <li *ngFor="let entry of collection.badgeEntries.entities | slice:0:(collection.badgeEntries.length > 12 ? 11 : 12)">
					          <div class="badge badge-flat">
						          <img [loaded-src]="entry.badge?.image"
						               [loading-src]="badgeLoadingImageUrl"
						               [error-src]="badgeFailedImageUrl"
						               alt="{{ entry.badge?.badgeClass.name }} Image"
						               width="40" />
					          </div>
					        </li>

					        <li *ngIf="collection.badgeEntries.length > 12">
					          <span class="card-x-more">{{ collection.badgeEntries.length - 11 }}<span> More</span></span>
					        </li>
					      </ul>
					    </span>
							</a>
							<div class="card-x-actions">
								<div>
									<input class="switch"
									       type="checkbox"
									       id="collection-{{ collection.slug }}-published-switch"
									       name="collection-{{ collection.slug }}-published-switch"
									       [checked]="collection.published"
									       (change)="togglePublishCollection(collection)">
									<label [attr.for]="'collection-'+ collection.slug +'-published-switch'">
								  <span class="switch-x-toggletext">
								    <span class="switch-x-unchecked"><span class="switch-x-hiddenlabel">Unchecked: </span>Private</span>
								    <span class="switch-x-checked"><span class="switch-x-hiddenlabel">Checked: </span>Public</span>
								  </span>
									</label>
								</div>

								<button class="button button-secondaryghost l-offsetright l-offsetbottom"
								        *ngIf="collection.published"
								        type="button"
								        (click)="shareCollection(collection)">Share</button>
							</div>
						</article>
					</div>
				</div>
			</ng-template>
		</main>
		`
})
export class RecipientBadgeCollectionListComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly noCollectionsImageUrl = require('../../breakdown/static/images/emptyillustration-nocollections.svg');
	readonly badgeLoadingImageUrl = require('../../breakdown/static/images/badge-loading.svg');
	readonly badgeFailedImageUrl = require('../../breakdown/static/images/badge-failed.svg');

	get badgeCollections(): RecipientBadgeCollection[] {
		return this.recipientBadgeCollectionManager.recipientBadgeCollectionList.entities;
	}

	collectionListLoaded: Promise<any>;

	constructor(
		router: Router,
		route: ActivatedRoute,
		loginService: SessionService,
		formBuilder: FormBuilder,
		private title: Title,
		private messageService: MessageService,
		private recipientBadgeCollectionManager: RecipientBadgeCollectionManager,
		private recipientBadgeManager: RecipientBadgeManager,
		private dialogService: CommonDialogsService
	) {
		super(router, route, loginService);

		title.setTitle("Collections - Badgr");

		this.collectionListLoaded = Promise.all([
			this.recipientBadgeCollectionManager.recipientBadgeCollectionList.loadedPromise,
			this.recipientBadgeManager.recipientBadgeList.loadedPromise
		]);
	}

	togglePublishCollection(collection: RecipientBadgeCollection) {
		collection.published = ! collection.published;

		if (collection.published) {
			collection.save().then(
				success => this.messageService.reportMinorSuccess(`Published collection ${collection.name} successfully`),
				failure => this.messageService.reportHandledError(`Failed to publish collection ${collection.name}`, failure)
			);
		} else {
			collection.save().then(
				success => this.messageService.reportMinorSuccess(`Unpublished collection ${collection.name} successfully`),
				failure => this.messageService.reportHandledError(`Failed to un-publish collection ${collection.name}`, failure)
			);
		}
	}

	shareCollection(collection: RecipientBadgeCollection) {
		this.dialogService.shareSocialDialog.openDialog(shareCollectionDialogOptionsFor(collection));
	}

	ngOnInit() {
		super.ngOnInit();
	}
}

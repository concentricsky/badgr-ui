import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Title } from "@angular/platform-browser";

import { MessageService } from "../common/services/message.service";
import { SessionService } from "../common/services/session.service";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { CommonDialogsService } from "../common/services/common-dialogs.service";

import { RecipientBadgeInstance } from "./models/recipient-badge.model";
import { RecipientBadgeCollection } from "./models/recipient-badge-collection.model";
import { RecipientBadgeManager } from "./services/recipient-badge-manager.service";
import { RecipientBadgeCollectionSelectionDialog } from "./recipient-badge-collection-selection-dialog";
import { preloadImageURL } from "../common/util/file-util";
import { ShareSocialDialogOptions } from "../common/dialogs/share-social-dialog.component";
import { addQueryParamsToUrl } from "../common/util/url-util";
import { ApiExternalToolLaunchpoint } from "app/externaltools/models/externaltools-api.model";
import { ExternalToolsManager } from "app/externaltools/services/externaltools-manager.service";
import { EventsService } from "../common/services/events.service";

@Component({
	selector: 'recipient-earned-badge-detail',
	template: `
		<main *bgAwaitPromises="[ badgesLoaded ]">
		
			<external-tool-launch></external-tool-launch>
			<form-message></form-message>

			<header class="wrap wrap-light l-containerhorizontal l-heading">
				<nav>
					<h1 class="visuallyhidden">Breadcrumbs</h1>
					<ul class="breadcrumb">
						<li><a [routerLink]="[recipient]">Backpack</a></li>
						<li class="breadcrumb-x-current">{{ badge?.badgeClass?.name || 'Loading...' }}</li>
					</ul>
				</nav>
				<div class="heading">
					<div class="heading-x-imageLarge">
						<div class="badge badge-flat">
							<img [loaded-src]="badge.image"
							     [loading-src]="badgeLoadingImageUrl"
							     [error-src]="badgeFailedImageUrl"
				           width="200" />
						</div>
					</div>
					<div class="heading-x-text">
						<h1>{{ badge.badgeClass.name }}</h1>
						
						<a class="stack" [href]="badge.badgeClass.issuer.id" target="_blank">
							<div class="stack-x-image">
								<img [loaded-src]="badge.badgeClass?.issuer?.image"
	                 [loading-src]="issuerImagePlacholderUrl"
	                 [error-src]="issuerImagePlacholderUrl"
	                 width="80" />
							</div>
							<div class="stack-x-text">
								<h2>{{ badge.badgeClass.issuer.name }}</h2>
								<small>{{ issuerBadgeCount }}</small>
							</div>
						</a>
						<p><small>Awarded <time [date]="badge?.issueDate" format="mediumDate"></time> to {{ badge.recipientEmail }}</small></p>

						<p style="font-size: 16px">{{ badge.badgeClass.description }}</p>

						<!-- criteria -->
						<section>
							<h1 *ngIf="badge.badgeClass.criteria_url || badge.badgeClass.criteria_text || badge.badgeClass.criteria">Criteria</h1>
							<show-more *ngIf="badge.badgeClass.criteria_text">
								<markdown-display [value]="badge.badgeClass.criteria_text"></markdown-display>
							</show-more>
							<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-right">
								<a
									*ngIf="badge.criteriaUrl"
									class="button button-primaryghost"
									[href]="badge.criteriaUrl"
									target="_blank">View external Criteria URL</a>
							</div>
						</section>

						<!-- tags -->
						<section>
							<h1 *ngIf="badge.badgeClass.tags">Tags</h1>
							<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-left">
								<span
									*ngFor="let tag of badge.badgeClass.tags; last as last">
									{{tag}}<span *ngIf="!last">,</span> 
								</span> 
							</div>
						</section>

						<!-- alignment -->
						<section>
						<h1 *ngIf="badge.badgeClass.alignment && badge.badgeClass?.alignment.length>0">Alignment</h1>
						<div class="bordered l-padding-2x l-marginBottom-2x"
						     *ngFor="let alignment of badge.badgeClass.alignment; let i=index">
							<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-spacebetween">
								<h1>{{alignment.targetName}}</h1>
								<small>{{alignment.targetCode}}</small>
							</div>
							{{alignment.targetDescription}}
							<div *ngIf="alignment.frameworkName">
								<h1>Framework</h1>
								{{alignment.frameworkName}}
							</div>
							<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-right">
								<a
									*ngIf="alignment.targetUrl"
									class="button button-primaryghost"
									[href]="alignment.targetUrl"
									target="_blank">View alignment URL</a>
							</div>
						</div>
						</section>

						<!-- evidence -->
						<section>
						<h1 *ngIf="badge.evidence_items?.length>0 || badge.narrative">Evidence</h1>
						<show-more *ngIf="badge.narrative">
							<markdown-display [value]="badge.narrative"></markdown-display>
						</show-more>
						<div class="bordered l-padding-2x l-marginBottom-2x"
						     *ngFor="let evidence of badge.evidence_items; let i=index">
							<show-more *ngIf="evidence.narrative">
								<markdown-display [value]="evidence.narrative"></markdown-display>
							</show-more>
							<div class="l-childrenhorizontal l-childrenhorizontal-small l-childrenhorizontal-right">
								<a
									*ngIf="evidence.evidence_url"
									class="button button-primaryghost"
									[href]="evidence.evidence_url"
									target="_blank">VIEW EVIDENCE URL</a>
							</div>
						</div>
						</section>

						<!-- delete button -->
						<div class="l-childrenhorizontal">
							<!--<a class="button button-primaryghost l-offsetleft" [href]="badge.badgeClass.criteria" target="_blank">View Criteria</a>-->
							<button class="button button-primaryghost l-offsetleft" (click)="deleteBadge(badge)" [disabled-when-requesting]="true">Delete Badge</button>
						</div>
						
						<h2>Collections</h2>
						<ul class="l-childrenhorizontal l-childrenhorizontal-small">
							<li *ngFor="let collection of badge.collections">
								<p class="connectionitem">
									<a [routerLink]="['/recipient/badge-collections/collection/', collection.slug]">{{ collection.name }}</a>
									<button type="button" (click)="removeCollection(collection)">Remove</button>
								</p>
							</li>
							<li>
								<button class="connectionadd"
								        [class.connectionadd-is-added]="badge.collections.length > 0"
								        (click)="manageCollections()">Add to collection</button>
							</li>
						</ul>
					</div>
					<div class="heading-x-actions">
						<button class="button button-major" type="button" (click)="shareBadge()">Share Badge</button>
						<ng-container *ngIf="launchpoints">
							<button *ngFor="let lp of launchpoints" class="button button-major" type="button" (click)="clickLaunchpoint(lp)">{{lp.label}}</button>
						</ng-container>
					</div>
				</div>

			</header>

			<div class="l-containerhorizontal l-headeredsection">

			</div>
			<recipient-badge-collection-selection-dialog #collectionSelectionDialog> </recipient-badge-collection-selection-dialog>
		</main>
		`
})
export class RecipientEarnedBadgeDetailComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly issuerImagePlacholderUrl = preloadImageURL(require('../../breakdown/static/images/placeholderavatar-issuer.svg'));
	readonly badgeLoadingImageUrl = require('../../breakdown/static/images/badge-loading.svg');
	readonly badgeFailedImageUrl = require('../../breakdown/static/images/badge-failed.svg');

	@ViewChild("collectionSelectionDialog")
	collectionSelectionDialog: RecipientBadgeCollectionSelectionDialog;

	badgesLoaded: Promise<any>;
	badges: Array<RecipientBadgeInstance> = [];
	badge: RecipientBadgeInstance;
	issuerBadgeCount:string;
	launchpoints: ApiExternalToolLaunchpoint[];


	get badgeSlug(): string { return this.route.snapshot.params['badgeSlug']; }
	get recipientBadgeInstances() { return this.recipientBadgeManager.recipientBadgeList }

	constructor(
		router: Router,
		route: ActivatedRoute,
		loginService: SessionService,
		private recipientBadgeManager: RecipientBadgeManager,
		private title: Title,
		private messageService: MessageService,
		private eventService: EventsService,
		private dialogService: CommonDialogsService,
		private externalToolsManager: ExternalToolsManager
	) {
		super(router, route, loginService);

		this.badgesLoaded = this.recipientBadgeManager.recipientBadgeList.loadedPromise
			.then( r => {
				this.updateBadge(r)
			})
			.catch(e => this.messageService.reportAndThrowError("Failed to load your badges", e));

		this.externalToolsManager.getToolLaunchpoints("earner_assertion_action").then(launchpoints => {
			this.launchpoints = launchpoints;
		})
	}

	ngOnInit() {
		super.ngOnInit();
	}

	shareBadge() {
		this.dialogService.shareSocialDialog.openDialog(badgeShareDialogOptionsFor(this.badge));
	}

	deleteBadge(badge: RecipientBadgeInstance) {
		this.dialogService.confirmDialog.openResolveRejectDialog({
			dialogTitle: "Confirm Remove",
			dialogBody: `Are you sure you want to remove ${badge.badgeClass.name} from your badges?`,
			rejectButtonLabel: "Cancel",
			resolveButtonLabel: "Remove Badge"
		}).then(
			() => this.recipientBadgeManager.deleteRecipientBadge(badge).then(
				() => {
					this.messageService.reportMajorSuccess(`${badge.badgeClass.name} has been deleted`, true);
					this.router.navigate([ '/recipient']);
				},
				error => {
					this.messageService.reportHandledError(`Failed to delete ${badge.badgeClass.name}`, error)
				}
			),
			() => {}
		);
	}

	manageCollections() {
		this.collectionSelectionDialog.openDialog({
			dialogId: "recipient-badge-collec",
			dialogTitle: "Add to Collection(s)",
			omittedCollection:this.badge
		})
		.then( RecipientBadgeCollection => {
			this.badge.collections.addAll(RecipientBadgeCollection)
			this.badge.save()
				.then(  success => this.messageService.reportMinorSuccess(`Collection ${this.badge.badgeClass.name} badges saved successfully`))
				.catch( failure => this.messageService.reportHandledError(`Failed to save Collection`, failure))
		})
	}

	removeCollection(collection: RecipientBadgeCollection){
		this.badge.collections.remove(collection);
		this.badge.save()
			.then(  success => this.messageService.reportMinorSuccess(`Collection removed successfully from ${this.badge.badgeClass.name}`))
			.catch( failure => this.messageService.reportHandledError(`Failed to remove Collection from badge`, failure))
	}

	private updateBadge(results){
		this.badge = results.entityForSlug(this.badgeSlug);
		// tag test
		//this.badge.badgeClass.tags = ['qwerty', 'boberty', 'BanannaFanna'];
		this.badges = results.entities;
		this.updateData();
	}

	private updateData(){
		this.title.setTitle("Backpack - Badgr - " + this.badge.badgeClass.name);

		this.badge.markAccepted();

		const issuerBadgeCount = () => {
			let count = this.badges
				.filter(instance => instance.issuerId == this.badge.issuerId)
				.length;
			return count == 1 ? "1 Badge" : `${count} Badges`;
		}
		this.issuerBadgeCount = issuerBadgeCount();
	}

	private clickLaunchpoint(launchpoint:ApiExternalToolLaunchpoint) {
		this.externalToolsManager.getLaunchInfo(launchpoint, this.badgeSlug).then(launchInfo => {
			this.eventService.externalToolLaunch.next(launchInfo);
		})
	}
}

export function badgeShareDialogOptionsFor(badge: RecipientBadgeInstance): ShareSocialDialogOptions {
	return badgeShareDialogOptions({
		shareUrl: badge.shareUrl,
		imageUrl: badge.image,
		badgeClassName: badge.badgeClass.name,
		badgeClassDescription: badge.badgeClass.description,
		issueDate: badge.issueDate,
		recipientName: badge.getExtension('extensions:recipientProfile', {'name': undefined}).name,
		recipientIdentifier: badge.recipientEmail
	});
}

interface BadgeShareOptions {
	shareUrl: string;
	imageUrl: string;
	badgeClassName: string;
	badgeClassDescription: string;
	issueDate: Date;
	recipientName?: string;
	recipientIdentifier?: string;
	recipientType?: string;
}

export function badgeShareDialogOptions(options:BadgeShareOptions): ShareSocialDialogOptions {
	return {
		title: "Share Badge",
		shareObjectType: "BadgeInstance",
		shareUrl: options.shareUrl,
		shareTitle: options.badgeClassName,
		// shareIdUrl: badge.url,
		shareIdUrl: options.shareUrl,
		shareSummary: options.badgeClassDescription,
		shareEndpoint: "certification",

		showRecipientOptions: true,
		recipientIdentifier: options.recipientIdentifier,
		recipientType: options.recipientType,

		versionOptions: [
			{
				label: "v1.1",
				shareUrl: addQueryParamsToUrl(options.shareUrl, { v: "1_1" })
			},
			{
				label: "v2.0",
				shareUrl: addQueryParamsToUrl(options.shareUrl, { v: "2_0" })
			}
		],

		versionInfoTitle: "We Support Open Badges v2.0!",
		versionInfoBody: "Badgr is testing the new version of Open Badges, v2.0. Badges accessed or downloaded in v2.0 format may not yet be accepted everywhere Open Badges are used.",


		embedOptions: [
			{
				label: "Card",
				embedTitle: "Badgr Badge: " + options.badgeClassName,
				embedType: "iframe",
				embedSize: { width: 330, height: 186 },
				embedVersion: 1,
				// The UI will show the embedded version because of the embedding params that are included automatically by the dialog
				embedUrl: options.shareUrl,
				embedLinkUrl: null
			},

			{
				label: "Badge",
				embedTitle: "Badgr Badge: " + options.badgeClassName,
				embedType: "image",
				embedSize: { width: 128, height: 128},
				embedVersion: 1,
				embedUrl: options.imageUrl,
				embedLinkUrl: options.shareUrl,
				embedAwardDate: options.issueDate,
				embedBadgeName: options.badgeClassName,
				embedRecipientName: options.recipientName,
			}
		]
	}
}
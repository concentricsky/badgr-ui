import { Component, OnInit } from "@angular/core";

import { ActivatedRoute, Router } from "@angular/router";
import { MessageService } from "../common/services/message.service";
import { BadgeClassManager } from "./services/badgeclass-manager.service";
import { BadgeClass } from "./models/badgeclass.model";
import { Issuer } from "./models/issuer.model";
import { Title } from "@angular/platform-browser";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { SessionService } from "../common/services/session.service";
import { StringMatchingUtil } from "../common/util/string-matching-util";
import { CommonDialogsService } from "../common/services/common-dialogs.service";
import { BadgeInstanceManager } from "./services/badgeinstance-manager.service";
import { BadgeClassInstances, BadgeInstance } from "./models/badgeinstance.model";


import { IssuerManager } from "./services/issuer-manager.service";
import { BadgrApiFailure } from "../common/services/api-failure";
import { preloadImageURL } from "../common/util/file-util";
import {EventsService} from "../common/services/events.service";
import {ExternalToolsManager} from "../externaltools/services/externaltools-manager.service";
import {ApiExternalToolLaunchpoint} from "../externaltools/models/externaltools-api.model";
import {BadgeInstanceSlug} from "./models/badgeinstance-api.model";
import {badgeShareDialogOptions} from "../recipient/recipient-earned-badge-detail.component";
import {ShareSocialDialogOptions} from "../common/dialogs/share-social-dialog.component";

@Component({
	selector: 'badgeclass-detail',
	template: `<main *bgAwaitPromises="[issuerLoaded, badgeClassLoaded]">
		<form-message></form-message>
		<external-tool-launch></external-tool-launch>
	
		<ng-template [ngIf]="badgeClass && issuer">
	
			<header class="wrap wrap-light l-containerhorizontal l-heading">
	
				<nav>
					<h1 class="visuallyhidden">Breadcrumbs</h1>
					<ul class="breadcrumb">
						<li><a [routerLink]="['/issuer']">Issuers</a></li>
						<li *ngIf="issuer"><a [routerLink]="['/issuer/issuers/', issuerSlug]">{{ issuer.name }}</a></li>
						<li class="breadcrumb-x-current" [truncatedText]="badgeClass?.name" [maxLength]="64"></li>
					</ul>
				</nav>
	
				<div class="heading">
					<div class="heading-x-imageLarge">
						<img src="{{badgeClass.image}}" alt="{{badgeClass.name}} image" >
					</div>
					<div class="heading-x-text">
						<h1>
							{{ badgeClass.name }}
							<button class="heading-x-edit"
							        type="button"
							        [routerLink]="['/issuer/issuers', issuerSlug, 'badges', badgeClass.slug, 'edit']"
							        >Edit
							</button>
						</h1>
						<!-- Whitespace is reserved, do not add additional whitespace within paragraph elements. -->
						<a class="stack" [routerLink]="['/issuer/issuers/', issuerSlug]" >
						  <div class="stack-x-image">
							  <img [loaded-src]="issuer.image"
							       [loading-src]="issuerImagePlaceHolderUrl"
							       [error-src]="issuerImagePlaceHolderUrl"
							       width="40"
							       alt="{{ issuer.name }} avatar"
							       />
						  </div>
						  <div class="stack-x-text">
						    <h2>{{ issuer.name }}</h2>
						    <small>{{ issuerBadgeCount }} {{ issuerBadgeCount == 1 ? 'Badge' : 'Badges' }}</small>
						  </div>
						</a>
						
						<div class="l-childrenhorizontal l-childrenhorizontal-small l-offsetleft">
							<a
								class="button button-primaryghost"
								[disabled-when-requesting]="true"
								(click)="deleteBadge()"
							>Delete Badge</a>
							<a
								*ngIf="badgeClass.criteria_url"
								class="button button-primaryghost"
								[href]="badgeClass.criteria_url"
								target="_blank"
							>View external Criteria</a>
						</div>

						<p class="heading-x-meta">
							Created On: <time [date]="badgeClass.createdAt" format="MM/dd/y"></time>
						</p>

						<section>
							<h1>Description</h1>
							<show-more>
								<p>{{ badgeClass.description }}</p>
							</show-more>
						</section>

						<section>
							<h1 *ngIf="badgeClass.criteria_url || badgeClass.criteria_text">
								Criteria
							</h1>
	
							<show-more *ngIf="badgeClass.criteria_text">
								<markdown-display [value]="badgeClass.criteria_text"></markdown-display>
							</show-more>
						</section>
					</div>
	
					<div class="heading-x-actions">
						<a class="button button-major"
						   [routerLink]="['/issuer/issuers', issuerSlug, 'badges', badgeClass.slug, 'issue']"
						   [disabled-when-requesting]="true"
						>Award Badge</a>
					</div>
	
				</div>
	
			</header>
	
			<div class="l-containerhorizontal l-containervertical l-childrenvertical">
	
				<h2 class="title title-is-smallmobile">{{ recipientCount }} Badge {{ recipientCount == 1 ? 'Recipient' : 'Recipients' }}</h2>
				<p *ngIf="recipientCount">{{instanceResults.length}} awards shown. You may search for other awards by exact email address/recipient identifier.</p>
	
				<input type="text"
				       class="search l-childrenhorizontal-x-offset"
				       placeholder="Filter Recipients"
				       [(ngModel)]="searchQuery"
				/>
				<ng-template [bgAwaitPromises]="[badgeInstancesLoaded]">
	
					<div class="l-overflowhorizontal" *ngIf="instanceResults?.length">
						<table class="table">
							<thead>
								<tr>
									<th scope="col">Email</th>
									<th scope="col">Awarded</th>
									<th scope="col"><span class="visuallyhidden">Actions</span></th>
								</tr>
							</thead>
							<tbody>
								<tr *ngFor="let instance of instanceResults">
									<th scope="row" class="l-wordwrap">
										{{ instance.recipientIdentifier }}
									</th>
									<td><time [date]="instance.issuedOn" format="mediumDate"></time></td>
									<td class="table-x-minwidthtablet-400">
										<div class="l-childrenhorizontal l-childrenhorizontal-right l-childrenhorizontal-stackmobile-flexalign-end">
											<a class="button button-primaryghost" [href]="instance.url" target="_blank">View</a>
											<button type="button" class="button button-primaryghost" (click)="shareInstance(instance)">Share</button>
											<button type="button" class="button button-primaryghost" (click)="revokeInstance(instance)">Revoke</button>
											<ng-container *ngIf="launchpoints">
												<button *ngFor="let lp of launchpoints" 
															  class="button button-primaryghost" 
															  type="button" 
															  (click)="clickLaunchpoint(lp, instance.slug)"
												>{{lp.label}}</button>
											</ng-container>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<p class="empty" *ngIf="! allBadgeInstances?.length">No recipients.</p>
					<p class="empty" *ngIf="allBadgeInstances?.length && ! instanceResults?.length">No recipients
						matching filter.</p>
				</ng-template>
			</div>
		</ng-template>
	</main>
	`
})
export class BadgeClassDetailComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly issuerImagePlacholderUrl = preloadImageURL(require('../../breakdown/static/images/placeholderavatar-issuer.svg'));

	private issuer: Issuer;
	private badgeClass: BadgeClass;
	private allBadgeInstances: BadgeClassInstances;
	private instanceResults: BadgeInstance[] = [];
	launchpoints: ApiExternalToolLaunchpoint[];

	private _searchQuery: string = "";
	get searchQuery() { return this._searchQuery; }

	set searchQuery(query) {
		this._searchQuery = query;
		this.loadInstances(query);
	}

	badgeClassLoaded: Promise<any>;
	badgeInstancesLoaded: Promise<any>;
	issuerLoaded: Promise<any>;

	get issuerSlug() {
		return this.route.snapshot.params['issuerSlug'];
	}

	get badgeSlug() {
		return this.route.snapshot.params['badgeSlug'];
	}

	get confirmDialog() {
		return this.dialogService.confirmDialog;
	}

	get recipientCount() {
		return this.badgeClass ? this.badgeClass.recipientCount : null;
	}

	constructor(
		protected title: Title,
		protected messageService: MessageService,
		protected badgeManager: BadgeClassManager,
		protected issuerManager: IssuerManager,
		protected badgeInstanceManager: BadgeInstanceManager,
		sessionService: SessionService,
		router: Router,
		route: ActivatedRoute,
		protected dialogService: CommonDialogsService,
		private eventService: EventsService,
		private externalToolsManager: ExternalToolsManager
	) {
		super(router, route, sessionService);

		this.badgeClassLoaded = badgeManager.badgeByIssuerSlugAndSlug(
			this.issuerSlug,
			this.badgeSlug
		).then(
			badge => {
				this.badgeClass = badge;
				this.title.setTitle(`Badge Class - ${this.badgeClass.name} - Badgr`);
			},
			error => this.messageService.reportLoadingError(`Cannot find badge ${this.issuerSlug} / ${this.badgeSlug}`,
				error)
		);

		this.loadInstances();

		this.issuerLoaded = issuerManager.issuerBySlug(this.issuerSlug).then(
			issuer => this.issuer = issuer,
			error => this.messageService.reportLoadingError(`Cannot find issuer ${this.issuerSlug}`, error)
		);

		this.externalToolsManager.getToolLaunchpoints("issuer_assertion_action").then(launchpoints => {
			this.launchpoints = launchpoints;
		})
	}

	loadInstances(recipientQuery?: string) {
	  let instances = new BadgeClassInstances(this.badgeInstanceManager, this.issuerSlug, this.badgeSlug, recipientQuery);
		this.badgeInstancesLoaded = instances.loadedPromise
			.then(
				instances => {
					this.allBadgeInstances = instances;
					this.updateResults();
				},
				error => {
					this.messageService.reportLoadingError(
						`Could not load recipients ${this.issuerSlug} / ${this.badgeSlug}`
					);
					return error
				}
			);
	}

	get issuerBadgeCount() {
		// Load the list if it's not present
		this.badgeManager.badgesByIssuerUrl.loadedPromise;

		const badges = this.badgeManager.badgesByIssuerUrl.lookup(this.issuer.issuerUrl);
		return badges && badges.length;
	}

	ngOnInit() {
		super.ngOnInit();
	}

	private updateResults() {
		this.instanceResults = this.allBadgeInstances.entities;
	}

	revokeInstance(
		instance: BadgeInstance
	) {
		this.confirmDialog.openResolveRejectDialog({
			dialogTitle: "Warning",
			dialogBody: `Are you sure you want to revoke <strong>${this.badgeClass.name}</strong> from <strong>${instance.recipientIdentifier}</strong>?`,
			resolveButtonLabel: "Revoke Badge",
			rejectButtonLabel: "Cancel"
		}).then(
			() => {
				instance.revokeBadgeInstance("Manually revoked by Issuer").then(
					(result) => {
						this.messageService.reportMinorSuccess(`Revoked badge to ${instance.recipientIdentifier}`);
						this.badgeClass.update();
						this.updateResults();
					},
					(error) =>
						this.messageService.reportAndThrowError(`Failed to revoke badge to ${instance.recipientIdentifier}`)
				)
			},
			() => void 0 // Cancel
		)
	}

	deleteBadge() {
		if (this.recipientCount == 0) {

			this.confirmDialog.openResolveRejectDialog({
				dialogTitle: "Warning",
				dialogBody: `Are you sure you want to delete the badge <strong>${this.badgeClass.name}</strong>?`,
				resolveButtonLabel: "Delete Badge",
				rejectButtonLabel: "Cancel",
			}).then(() => {

				this.badgeManager.removeBadgeClass(this.badgeClass).then(
					(success) => {
						this.messageService.reportMajorSuccess(`Removed badge class: ${this.badgeClass.name}.`)
						this.router.navigate([ 'issuer/issuers', this.issuerSlug ]);
					},
					(error) => {
						this.messageService.reportAndThrowError(`Failed to delete badge class: ${BadgrApiFailure.from(error).firstMessage}`);
					}
				);

			}, () => void 0);

		} else {

			this.confirmDialog.openResolveRejectDialog({
				dialogTitle: "Error",
				dialogBody: `All instances of <strong>${this.badgeClass.name}</strong> must be revoked before you can delete it`,
				resolveButtonLabel: "Ok",
				showRejectButton: false
			}).then(() => void 0, () => void 0)

		}
	}

	private clickLaunchpoint(launchpoint:ApiExternalToolLaunchpoint, instanceSlug: BadgeInstanceSlug) {
		this.externalToolsManager.getLaunchInfo(launchpoint, instanceSlug).then(launchInfo => {
			this.eventService.externalToolLaunch.next(launchInfo, );
		})
	}

	shareInstance(instance: BadgeInstance) {
		this.dialogService.shareSocialDialog.openDialog(this.badgeShareDialogOptionsFor(instance));
	}

	badgeShareDialogOptionsFor(badge: BadgeInstance): ShareSocialDialogOptions {
		return badgeShareDialogOptions({
			shareUrl: badge.instanceUrl,
			imageUrl: badge.image,
			badgeClassName: this.badgeClass.name,
			badgeClassDescription: this.badgeClass.description,
			issueDate: badge.issuedOn,
			recipientName: badge.getExtension('extensions:recipientProfile', {'name': undefined}).name,
			recipientIdentifier: badge.recipientIdentifier,
			recipientType: badge.recipientType
		});
	}
}


class MatchingAlgorithm {
	static instanceMatcher(inputPattern: string): (instance: BadgeInstance) => boolean {
		let patternStr = StringMatchingUtil.normalizeString(inputPattern);
		let patternExp = StringMatchingUtil.tryRegExp(patternStr);

		return instance => (
			StringMatchingUtil.stringMatches(instance.recipientIdentifier, patternStr, patternExp)
		)
	}
}
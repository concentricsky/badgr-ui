import { Component, OnInit, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { Title } from "@angular/platform-browser";

import { CommonDialogsService } from "../common/services/common-dialogs.service";
import { StringMatchingUtil } from "../common/util/string-matching-util";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { groupIntoArray, groupIntoObject } from "../common/util/array-reducers";
import { MessageService } from "../common/services/message.service";
import { SessionService } from "../common/services/session.service";

import { AddBadgeDialogComponent } from "./add-badge-dialog.component";
import { RecipientBadgeManager } from "./services/recipient-badge-manager.service";
import { ApiRecipientBadgeIssuer } from "./models/recipient-badge-api.model";
import { RecipientBadgeInstance } from "./models/recipient-badge.model";
import { badgeShareDialogOptionsFor } from "./recipient-earned-badge-detail.component";
import {UserProfileManager} from "../common/services/user-profile-manager.service";

type BadgeDispay = "grid" | "list" ;

@Component({
	selector: 'recipient-earned-badge-list',
	template: `
		<main>
			<form-message></form-message>

			<header class="wrap wrap-light l-containerhorizontal l-heading">
				<div class="heading">
					<div class="heading-x-text">
						<h1>Backpack <span *ngIf="!! allBadges">{{ allBadges.length }} {{ allBadges.length == 1 ? "Badge" : "Badges" }}</span></h1>
					</div>
					<div class="heading-x-actions">
						<a class="button button-major" (click)="addBadge()" [disabled-when-requesting]="true">Add Badge</a>
					</div>
				</div>
			</header>

			<ng-template [bgAwaitPromises]="[ badgesLoaded ]">
				<article class="emptyillustration l-containervertical" *ngIf="allBadges.length == 0">
					<h1>You have no badges</h1>
					  <div>
					    Collect and share digital badges you've earned from Badgr or any Open Badges issuer.
					    <a href="http://www.openbadges.org" target="_blank">Learn more</a> about Open Badges
					  </div>
					<img [src]="noBadgesImageUrl" alt="Illustration description">
				</article>

				<div class="l-containerhorizontal wrap" *ngIf="allBadges.length > 0">
					<div class="l-controls bordered bordered-bottom">
						<div>
							<input
								type="text"
								class="search"
								placeholder="Search Badges"
								[(ngModel)]="searchQuery">
						</div>

						<!-- Toggle  between list and grid view -->
						<div>
							<label class="formcheckbox" >
								<input type="checkbox" [(ngModel)]="groupByIssuer" />
								<span class="formcheckbox-x-text">Group by Issuer</span>
							</label>
							<div class="radiobuttons">
								<input type="radio" name="radiobutton" id="radiobutton1" [(ngModel)]="badgesDisplay" value="grid" checked="checked">
								<label class="radiobuttons-x-grid" for="radiobutton1">Grid</label>
								<input type="radio" name="radiobutton" id="radiobutton2" [(ngModel)]="badgesDisplay" value="list">
								<label class="radiobuttons-x-list" for="radiobutton2">List</label>
							</div>
						</div>

					</div>

					<div class="l-headeredsection">

						<!-- Grid View -->
						<ng-template [ngIf]="badgesDisplay == 'grid'">

								<!-- ------------------ UNGROUPED ------------------  -->
								<ng-template [ngIf]="! groupByIssuer">
									<div class="l-gridthree">
										<div *ngFor="let badgeResult of badgeResults">
											<article class="card card-largeimage">
												<a class="card-x-main" [routerLink]="['../earned-badge', badgeResult.badge.slug]">
													<p class="card-x-label" *ngIf="badgeResult.badge.isNew">New</p>
													<div class="card-x-image">
														<img [loaded-src]="badgeResult.badge.image"
														     [loading-src]="badgeLoadingImageUrl"
														     [error-src]="badgeFailedImageUrl" 
														     width="80">
													</div>
													<div class="card-x-text">
														<h1>{{ badgeResult.badge.badgeClass.name }}</h1>
														<small>{{ badgeResult.badge.badgeClass.issuer.name }}</small>
														<p [truncatedText]="badgeResult.badge.badgeClass.description" [maxLength]="100"></p>
													</div>
												</a>
												<div class="card-x-actions">
													<div><small>Awarded</small> <time [date]="badgeResult?.badge?.issueDate" format="mediumDate"></time></div>
													<button class="button button-secondaryghost l-offsetright l-offsetbottom" (click)="shareBadge(badgeResult.badge)">Share</button>
												</div>
											</article>
										</div>
									</div>
								</ng-template>

								<!-- ------------------ GROUP BY ISSUER ------------------  -->
								<ng-template [ngIf]="groupByIssuer">
									<div *ngFor="let issuerGroup of issuerResults">
										
                                        <header>
											<h1 class="title title-margin-bottom-2x">{{ issuerGroup.issuer.name }} <span>{{ issuerGroup.badges.length }} {{ issuerGroup.badges.length == 1 ? "Badge" : "Badges" }}</span></h1>
										</header>

										<div class="l-gridthree">
											<div *ngFor="let badge of issuerGroup.badges">
												<article class="card card-largeimage">
													<a class="card-x-main" [routerLink]="['../earned-badge', badge.slug]">
														<p class="card-x-label" *ngIf="badge.isNew">New</p>
														<div class="card-x-image">
															<div class="badge badge-flat">
																<img [loaded-src]="badge.image"
																     [loading-src]="badgeLoadingImageUrl"
																     [error-src]="badgeFailedImageUrl"
						                         width="80" />
															</div>
														</div>
														<div class="card-x-text">
															<h1>{{ badge.badgeClass.name }}</h1>
															<small>{{ badge.badgeClass.issuer.name }}</small>
															<p [truncatedText]="badge.badgeClass.description" [maxLength]="100"></p>
														</div>
													</a>
													<div class="card-x-actions">
														<div><small>Awarded</small> <time [date]="badge.issueDate" format="mediumDate"></time></div>
														<button class="button button-secondaryghost l-offsetright l-offsetbottom" (click)="shareBadge(badge)">Share</button>
													</div>
												</article>
											</div>
										</div>
									</div>
								</ng-template>

							</ng-template>

						<!-- List View -->
						<ng-template [ngIf]="badgesDisplay == 'list'">

							<div class="l-overflowhorizontal">
								<table class="table">
									<thead>
										<tr>
											<th scope="col">Badge</th>
											<th class="hidden hidden-is-desktop" scope="col">Issuer</th>
											<th class="hidden hidden-is-desktop" scope="col">Awarded</th>
											<th class="table-x-hidetext hidden hidden-is-tablet" scope="col">Actions</th>
										</tr>
									</thead>

									<tbody>
									<ng-template ngFor let-issuerGroup [ngForOf]="issuerResults" let-i="index" >
										<tr *ngIf="groupByIssuer">
											<th class="table-x-inlineheader" scope="row" colspan="4">{{ issuerGroup.issuer.name }}</th>
										</tr>

										<ng-template ngFor let-badge [ngForOf]="issuerGroup.badges" let-i="index" >
										<tr>
											<th scope="row">
												<a class="stack stack-list"
													 [routerLink]="['../earned-badge', badge.slug]">
													<span class="stack-x-image">
														<img [loaded-src]="badge.image"
														     [loading-src]="badgeLoadingImageUrl"
														     [error-src]="badgeFailedImageUrl"
					                       width="40" />
													</span>
													<span *ngIf="badge.isNew" class="stack-x-new">New</span> 
													<span class="stack-x-text">
														<span class="stack-x-title">{{ badge.badgeClass.name }}</span>
													</span>
												</a>
											</th>
											<td class="hidden hidden-is-desktop">{{ badge.badgeClass.issuer.name }}</td>
											<td class="hidden hidden-is-desktop"><time [date]="badge?.issueDate" format="mediumDate"></time></td>
											<td class="hidden hidden-is-tablet">
												<div class="l-childrenhorizontal l-childrenhorizontal-right">
													<button class="button button-primaryghost" type="button" (click)="shareBadge(badge)">Share</button>
												</div>
											</td>
										</tr>
										</ng-template>

									</ng-template>
									</tbody>

								</table>
							</div>
						</ng-template>
					</div>
				</div>
			</ng-template>

			<add-badge-dialog #addBadgeDialog></add-badge-dialog>
		</main>
		`
})

export class RecipientEarnedBadgeListComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly noBadgesImageUrl = require('../../breakdown/static/images/emptyillustration-nobadges.svg');
	readonly badgeLoadingImageUrl = require('../../breakdown/static/images/badge-loading.svg');
	readonly badgeFailedImageUrl = require('../../breakdown/static/images/badge-failed.svg');

	@ViewChild("addBadgeDialog")
	addBadgeDialog: AddBadgeDialogComponent;

	allBadges: RecipientBadgeInstance[];
	badgesLoaded: Promise<any>;
	allIssuers: ApiRecipientBadgeIssuer[];

	badgeResults: BadgeResult[] = [];
	issuerResults: MatchingIssuerBadges[] = [];
	badgeClassesByIssuerId: { [issuerUrl: string]: RecipientBadgeInstance[] };

	maxDisplayedResults = 100;

	private _badgesDisplay:BadgeDispay = "grid";
	get badgesDisplay(){return this._badgesDisplay}
	set badgesDisplay(val:BadgeDispay){
		this._badgesDisplay = val;
		//this.updateResults();
		this.saveDisplayState();
	}

	private _groupByIssuer: boolean = false;
	get groupByIssuer(){return this._groupByIssuer}
	set groupByIssuer(val:boolean){
		this._groupByIssuer = val;
		this.saveDisplayState();
		this.updateResults();
	}

	private _searchQuery: string = "";
	get searchQuery() { return this._searchQuery; }
	set searchQuery(query) {
		this._searchQuery = query;
		this.saveDisplayState();
		this.updateResults();
	}

	constructor(
		router: Router,
		route: ActivatedRoute,
		sessionService: SessionService,

		private title: Title,
		private dialogService: CommonDialogsService,
		private messageService: MessageService,
		private recipientBadgeManager: RecipientBadgeManager,
		private profileManager: UserProfileManager
	) {
		super(router, route, sessionService);

		title.setTitle("Backpack - Badgr");

		this.badgesLoaded = this.recipientBadgeManager.recipientBadgeList.loadedPromise
			.catch(e => this.messageService.reportAndThrowError("Failed to load your badges", e));

		this.recipientBadgeManager.recipientBadgeList.changed$.subscribe(
			badges => this.updateBadges(badges.entities)
		);

		if (sessionService.isLoggedIn) {
			// force a refresh of the userProfileSet now that we are authenticated
			profileManager.userProfileSet.updateList().then(p => {
				if (profileManager.userProfile.agreedTermsVersion != profileManager.userProfile.latestTermsVersion) {
					dialogService.newTermsDialog.openDialog();
				}
			})
		}

		this.restoreDisplayState();
	}

	restoreDisplayState() {
		try {
			const state: any = JSON.parse(window.localStorage["recipient-earned-badge-list-viewstate"]);

			this.groupByIssuer = state["groupByIssuer"];
			this.searchQuery = state["searchQuery"];
			this.badgesDisplay = state["badgesDisplay"];
		} catch (e) {
			// Bad serialization
		}
	}

	saveDisplayState() {
		try {
			window.localStorage["recipient-earned-badge-list-viewstate"] = JSON.stringify({
				groupByIssuer: this.groupByIssuer,
				searchQuery: this.searchQuery,
				badgesDisplay: this.badgesDisplay
			});
		} catch (e) {
			// We can't always save to local storage
		}
	}

	ngOnInit() {
		super.ngOnInit();
	}

	addBadge() {
		this.addBadgeDialog.openDialog({})
			.then(
				() => {},
				() => {}
			)
	}

	shareBadge(badge: RecipientBadgeInstance) {
		badge.markAccepted();

		this.dialogService.shareSocialDialog.openDialog(badgeShareDialogOptionsFor(badge));
	}

	deleteBadge(badge: RecipientBadgeInstance) {
		this.dialogService.confirmDialog.openResolveRejectDialog({
			dialogTitle: "Confirm Remove",
			dialogBody: `Are you sure you want to remove ${badge.badgeClass.name} from your badges?`,
			rejectButtonLabel: "Cancel",
			resolveButtonLabel: "Remove Badge"
		}).then(
			() => this.recipientBadgeManager.deleteRecipientBadge(badge),
			() => {}
		);
	}

	private updateBadges(allBadges: RecipientBadgeInstance[]) {
		this.badgeClassesByIssuerId = allBadges
			.reduce(groupIntoObject<RecipientBadgeInstance>(b => b.issuerId), {});

		this.allIssuers = allBadges
			.reduce(groupIntoArray<RecipientBadgeInstance, string>(b => b.issuerId), [])
			.map(g => g.values[0].badgeClass.issuer);

		this.allBadges = allBadges;

		this.updateResults();
	}

	private updateResults() {
		// Clear Results
		this.badgeResults.length = 0;
		this.issuerResults.length = 0;

		let issuerResultsByIssuer: {[issuerUrl: string]: MatchingIssuerBadges} = {};

		const addBadgeToResults = (badge: RecipientBadgeInstance) => {
			// Restrict Length
			if (this.badgeResults.length > this.maxDisplayedResults) {
				return false;
			}

			let issuerResults = issuerResultsByIssuer[ badge.issuerId ];

			if (!issuerResults) {
				issuerResults = issuerResultsByIssuer[ badge.issuerId ] = new MatchingIssuerBadges(
					badge.issuerId,
					badge.badgeClass.issuer
				);

				//append result to the issuerResults array bound to the view template.
				this.issuerResults.push(issuerResults);
			}

			issuerResults.addBadge(badge);

			if (!this.badgeResults.find(r => r.badge == badge)) {
				//appending the results to the badgeResults array bound to the view template.
				this.badgeResults.push(new BadgeResult(badge, issuerResults.issuer));
			}

			return true;
		};

		const addIssuerToResults = (issuer: ApiRecipientBadgeIssuer) => {
			(this.badgeClassesByIssuerId[ issuer.id ] || []).forEach(addBadgeToResults);
		};

		this.allIssuers
			.filter(MatchingAlgorithm.issuerMatcher(this.searchQuery))
			.forEach(addIssuerToResults);

		this.allBadges
			.filter(MatchingAlgorithm.badgeMatcher(this._searchQuery))
			.forEach(addBadgeToResults);

		this.badgeResults.sort((a, b) => b.badge.issueDate.getTime() - a.badge.issueDate.getTime());
		this.issuerResults.forEach(r => r.badges.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime()))
	}
}

class BadgeResult {
	constructor(public badge: RecipientBadgeInstance, public issuer: ApiRecipientBadgeIssuer) {}
}

class MatchingIssuerBadges {
	constructor(
		public issuerId: string,
		public issuer: ApiRecipientBadgeIssuer,
		public badges: RecipientBadgeInstance[] = []
	) {}

	addBadge(badge: RecipientBadgeInstance) {
		if (badge.issuerId == this.issuerId) {
			if (this.badges.indexOf(badge) < 0) {
				this.badges.push(badge);
			}
		}
	}
}

class MatchingAlgorithm {
	static issuerMatcher(inputPattern: string): (issuer: ApiRecipientBadgeIssuer) => boolean {
		let patternStr = StringMatchingUtil.normalizeString(inputPattern);
		let patternExp = StringMatchingUtil.tryRegExp(patternStr);

		return issuer => (
			StringMatchingUtil.stringMatches(issuer.name, patternStr, patternExp)
		);
	}

	static badgeMatcher(inputPattern: string): (badge: RecipientBadgeInstance) => boolean {
		let patternStr = StringMatchingUtil.normalizeString(inputPattern);
		let patternExp = StringMatchingUtil.tryRegExp(patternStr);

		return badge => (
			StringMatchingUtil.stringMatches(badge.badgeClass.name, patternStr, patternExp)
		);
	}
}

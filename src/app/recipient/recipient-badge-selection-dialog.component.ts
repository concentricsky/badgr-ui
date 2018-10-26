import { Component, ViewChild, AfterViewInit, ElementRef, Renderer, Renderer2 } from "@angular/core";
import { MessageService } from "../common/services/message.service";
import { registerDialog } from "dialog-polyfill/dialog-polyfill";
import "rxjs/add/observable/combineLatest";
import "rxjs/add/operator/first";
import { StringMatchingUtil } from "../common/util/string-matching-util";
import { SettingsService } from "../common/services/settings.service";
import { ApiRecipientBadgeIssuer } from "./models/recipient-badge-api.model";
import { RecipientBadgeManager } from "./services/recipient-badge-manager.service";
import { RecipientBadgeInstance } from "./models/recipient-badge.model";
import { BadgeInstanceUrl } from "../issuer/models/badgeinstance-api.model";
import { groupIntoArray, groupIntoObject } from "../common/util/array-reducers";
import { BaseDialog } from "../common/dialogs/base-dialog";

export interface RecipientBadgeSelectionDialogOptions {
	dialogId: string;
	dialogTitle: string;
	multiSelectMode: boolean;
	restrictToIssuerId?: string;
	omittedCollection?: RecipientBadgeInstance[];
}

type BadgeSortBy = "name" | "newest-first" | "oldest-first";

export interface RecipientBadgeSelectionDialogSettings {
	groupByIssuer: boolean;
	badgeSortBy: BadgeSortBy;
}

@Component({
	selector: 'recipient-badge-selection-dialog',
	template: `
		<dialog class="dialog dialog-large">

			<section class="l-overflowlist">
				<!-- Header and Search Area -->
				<header class="l-childrenvertical l-childrenvertical-is-smalldesktop bordered bordered-bottom">
					<h1 class="title">{{ dialogTitle }}</h1>
					<div class="l-childrenhorizontal l-childrenhorizontal-stackmobile">
						<input type="text"
						       class="search l-childrenhorizontal-x-offset"
						       placeholder="Filter your badges"
						       [(ngModel)]="searchQuery"
						/>
						<label *ngIf="! isRestrictedToSingleIssuer && hasMultipleIssuers"
									 class="formcheckbox">
							<input type="checkbox" [(ngModel)]="groupByIssuer" />
							<span class="formcheckbox-x-text">Group by Issuer</span>
						</label>
					</div>
				</header>
				<!-- Badge List -->
				<div class="l-overflowlist-x-list">
					<table class="table table-dialog" *bgAwaitPromises="[badgesLoaded]">
						<thead>
							<tr>
								<th colspan="3">Badge</th>
								<th><span class="table-x-issued hidden hidden-is-tablet">Awarded</span></th>
							</tr>
						</thead>

						<tbody>
							<!-- Empty state - no badges -->
							<tr *ngIf="badgeResults.length < 1">
								<td class="table-x-padded">
									<ng-template [ngIf]="hasMultipleIssuers">
										No badges or issuers matching your query
									</ng-template>
									<ng-template [ngIf]="! hasMultipleIssuers">
										No badges matching your query
									</ng-template>
								</td>
								<td class="table-x-padded"></td>
							</tr>
							<!-- Badges grouped by Issuer -->
							<ng-template [ngIf]="groupByIssuer && hasMultipleIssuers">
								<ng-template ngFor let-issuerResults [ngForOf]="issuerResults">
									<tr>
										<td colspan="4" class="table-x-inlineheader">{{ issuerResults.issuer?.name || "Unknown Issuer" }}</td>
									</tr>
									<tr *ngFor="let badge of issuerResults.badges">
										<td class="table-x-input">
											<input class="checklist"
											       type="checkbox"
											       id="badge-check-{{ badge.slug }}"
											       #badgeCheckbox
											       [checked]="selectedBadges.has(badge)"
											       (change)="updateBadgeSelection(badge, badgeCheckbox.checked)"
											       *ngIf="multiSelectMode"
											/>
											<input class="checklist checklist-radio"
											       type="radio"
											       id="badge-check-{{ badge.slug }}"
											       #badgeRadio
											       [checked]="selectedBadges.has(badge)"
											       (change)="updateBadgeSelection(badge, badgeRadio.checked)"
											       name="badge-selection-radio"
											       *ngIf="! multiSelectMode"
											/>
											<label htmlFor="badge-check-{{ badge.slug }}">{{ badge.name }}</label>
										</td>
										<td>
											<label htmlFor="badge-check-{{ badge.slug }}"
														 class="table-x-badge">
												<img src="{{ badge.image }}" width="40" height="40" alt="{{ badge.badgeClass.name }}">
											</label>
										</td>
										<td class="table-x-span">
											<label htmlFor="badge-check-{{ badge.slug }}"
														 class="stack stack-list table-x-stack">
												<span class="stack-x-text">
													<h1>{{ badge.badgeClass.name }}</h1>
													<small>{{ badge.badgeClass.issuer?.name || "Unknown Issuer" }}</small>
												</span>
											</label>
										</td>
										<td class="table-x-issued table-x-padded"><span class="hidden hidden-is-tablet">{{ badge.issueDate | date: 'longDate'}}</span></td>
									</tr>
								</ng-template>
							</ng-template>
							
							<!-- Badges not grouped by Issuer -->
							<ng-template [ngIf]="! groupByIssuer || ! hasMultipleIssuers">
								<tr *ngFor="let badgeResult of badgeResults">
									<td class="table-x-input">
										<input class="checklist"
										       type="checkbox"
										       id="badge-check-{{ badgeResult.badge.slug }}"
										       #badgeCheckbox							
										       [checked]="selectedBadges.has(badgeResult.badge)"
										       (change)="updateBadgeSelection(badgeResult.badge, badgeCheckbox.checked)"
										       *ngIf="multiSelectMode"
										/>
										<input class="checklist checklist-radio"
										       type="radio"
										       id="badge-check-{{ badgeResult.badge.slug }}"
										       #badgeRadio
										       [checked]="selectedBadges.has(badgeResult.badge)"
										       (change)="updateBadgeSelection(badgeResult.badge, badgeRadio.checked)"
										       name="badge-selection-radio"
										       *ngIf="! multiSelectMode"
										/>
										<label htmlFor="badge-check-{{ badgeResult.badge.slug }}">{{ badgeResult.badge.badgeClass.name }}</label>
									</td>
									
									<td>
										<label htmlFor="badge-check-{{ badgeResult.badge.slug }}"
													 class="table-x-badge">
											<img [src]="badgeResult.badge.image" width="40" height="40" alt="{{ badgeResult.badge.badgeClass.name }}">
										</label>
									</td>
									
									<td class="table-x-span">
										<label htmlFor="badge-check-{{ badgeResult.badge.slug }}"
													 class="stack stack-list table-x-stack">
											<span class="stack-x-text">
							                  <h1>{{ badgeResult.badge.badgeClass.name }}</h1>
								                <small>{{ badgeResult.issuer?.name || "Unknown Issuer" }}</small>
											</span>
											<span *ngIf="badgeResult.badge.mostRelevantStatus" class="status status-{{badgeResult.badge.mostRelevantStatus}}">
												{{badgeResult.badge.mostRelevantStatus}}
											</span> 
										</label>
									</td>
									
									<td class="table-x-issued table-x-padded"><span class="hidden hidden-is-tablet">{{ badgeResult.badge.issueDate | date: 'longDate'}}</span></td>
								</tr>
							</ng-template>
							
						</tbody>
					</table>
				</div>

				<!-- Selected Badges and Buttons -->
				<footer class="bordered bordered-top">
					<div class="l-childrenhorizontal l-childrenhorizontal-right l-childrenhorizontal-small">
						<button class="button button-primaryghost" (click)="cancelDialog()">Cancel</button>
						<button class="button" (click)="saveDialog()">Save Changes</button>
					</div>
				</footer>
			</section>
		</dialog>
		`
})
export class RecipientBadgeSelectionDialog extends BaseDialog {
	dialogId: string = "recipientBadgeDialog";
	dialogTitle: string = "Select Badges";

	multiSelectMode: boolean = false;
	restrictToIssuerId: string = null;

	private omittedCollection:RecipientBadgeInstance[];
	private selectedBadges = new Set<RecipientBadgeInstance>();
	private resolveFunc: { (badges: RecipientBadgeInstance[]): void };

	maxDisplayedResults = 100;
	badgeResults: BadgeResult[] = [];
	issuerResults: MatchingIssuerBadges[] = [];

	badgeClassesByIssuerId: { [issuerUrl: string]: RecipientBadgeInstance[] };
	allBadges: RecipientBadgeInstance[];
	allIssuers: ApiRecipientBadgeIssuer[];

	hasMultipleIssuers: boolean = true;

	badgesLoaded: Promise<any>;

	private _searchQuery: string = "";
	get searchQuery() { return this._searchQuery; }

	set searchQuery(query) {
		this._searchQuery = query;
		this.updateResults();
	}

	get isRestrictedToSingleIssuer(): boolean {
		return !!this.restrictToIssuerId;
	}

	static defaultSettings: RecipientBadgeSelectionDialogSettings = {
		groupByIssuer: true,
		badgeSortBy: "newest-first"
	};
	settings: RecipientBadgeSelectionDialogSettings = Object.assign({}, RecipientBadgeSelectionDialog.defaultSettings);

	get badgeSortBy() { return this.settings.badgeSortBy; }

	set badgeSortBy(badgeSortBy: BadgeSortBy) {
		this.settings.badgeSortBy = badgeSortBy || "name";
		this.applySorting();
		this.saveSettings();
	}

	get groupByIssuer() { return this.settings.groupByIssuer }

	set groupByIssuer(value: boolean) {
		this.settings.groupByIssuer = value;
		this.saveSettings();
	}

	private loadedData = false;

	constructor(
		componentElem: ElementRef,
		renderer: Renderer2,
		private badgeManager: RecipientBadgeManager,
		private messageService: MessageService,
		private settingsService: SettingsService
	) {

		super(componentElem, renderer);
	}

	openDialog(
		{
			dialogId,
			dialogTitle = "Select Badges",
			multiSelectMode = true,
			restrictToIssuerId = null,
			omittedCollection = []
		}: RecipientBadgeSelectionDialogOptions
	): Promise<RecipientBadgeInstance[]> {
		this.showModal();
		this._searchQuery = "";
		this.dialogId = dialogId;
		this.dialogTitle = dialogTitle;
		this.multiSelectMode = multiSelectMode;
		this.restrictToIssuerId = restrictToIssuerId;
		this.selectedBadges.clear();

		this.omittedCollection = omittedCollection;
		this.loadSettings();
		this.updateData();

		return new Promise<RecipientBadgeInstance[]>((resolve, reject) => {
			this.resolveFunc = resolve;
		});
	}

	cancelDialog() {
		this.closeModal();
	}

	saveDialog() {
		this.closeModal();
		this.resolveFunc(Array.from(this.selectedBadges.values()));
	}

	updateBadgeSelection(badgeClass: RecipientBadgeInstance, select: boolean) {
		if (select) {
			this.selectedBadges.add(badgeClass);
		} else {
			this.selectedBadges.delete(badgeClass);
		}
	}

	private loadSettings() {
		this.settings = this.settingsService.loadSettings(this.dialogId, RecipientBadgeSelectionDialog.defaultSettings);
	}

	private saveSettings() {
		this.settingsService.saveSettings(this.dialogId, this.settings);
	}

	private updateData() {
		this.badgesLoaded =
			this.badgeManager.recipientBadgeList.loadedPromise
				.then(
					list => this.updateBadges(list.entities),
					err => this.messageService.reportAndThrowError("Failed to load badge list", err)
				);
	}

	private updateBadges(allBadges: RecipientBadgeInstance[]) {
		this.loadedData = true;

		this.badgeClassesByIssuerId = allBadges
			.reduce(groupIntoObject<RecipientBadgeInstance>(b => b.issuerId), {});

		this.allIssuers = allBadges
			.reduce(groupIntoArray<RecipientBadgeInstance, string>(b => b.issuerId), [])
			.map(g => g.values[0].badgeClass.issuer);

		this.allBadges = allBadges;

		this.hasMultipleIssuers = ! this.restrictToIssuerId && (new Set(allBadges.map(b => b.issuerId))).size > 1;

		this.updateResults();
	}

	private updateResults() {
		// Clear Results
		this.badgeResults.length = 0;
		this.issuerResults.length = 0;

		let issuerResultsByIssuer: {[issuerUrl: string]: MatchingIssuerBadges} = {};
		let addedBadgeUrls = new Set<BadgeInstanceUrl>();

		const addBadgeToResults = (badge: RecipientBadgeInstance) => {
			if (addedBadgeUrls.has(badge.url)) {
				return;
			} else {
				addedBadgeUrls.add(badge.url);
			}

			// Restrict Length
			if (this.badgeResults.length > this.maxDisplayedResults) {
				return false;
			}

			// Restrict to issuer
			if (this.restrictToIssuerId && badge.issuerId != this.restrictToIssuerId) {
				return false;
			}
			//excluded omitted badges
			if(this.omittedCollection.indexOf(badge) === -1) {

				let issuerResults = issuerResultsByIssuer[ badge.issuerId ];
				if (!issuerResults) {
					issuerResults = issuerResultsByIssuer[ badge.issuerId ] = new MatchingIssuerBadges(
						badge.issuerId,
						badge.badgeClass.issuer
					);
					this.issuerResults.push(issuerResults);
				}

				issuerResults.addBadge(badge);


				if (!this.badgeResults.find(r => r.badge == badge)) {
					this.badgeResults.push(new BadgeResult(badge, issuerResults.issuer));
				}
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
			.filter(MatchingAlgorithm.badgeMatcher(this.searchQuery))
			.forEach(addBadgeToResults);

		this.applySorting();
	}

	applySorting() {
		const badgeSorter = (a: RecipientBadgeInstance, b: RecipientBadgeInstance) => {
			if (this.badgeSortBy === "name") {
				var aName = a.badgeClass.name.toLowerCase();
				var bName = b.badgeClass.name.toLowerCase();

				return aName == bName ? 0 : (aName < bName ? -1 : 1);
			}
			else if (this.badgeSortBy === "newest-first") {
				return b.issueDate.getTime() - a.issueDate.getTime();
			}
			else if (this.badgeSortBy === "oldest-first") {
				return a.issueDate.getTime() - b.issueDate.getTime();
			}
		};

		(this.badgeResults || []).sort((a, b) => badgeSorter(a.badge, b.badge));
		(this.issuerResults || []).forEach(i => i.badges.sort(badgeSorter));
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

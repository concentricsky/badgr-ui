import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Title } from "@angular/platform-browser";

import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";

import { SessionService } from "../common/services/session.service";
import { MessageService } from "../common/services/message.service";
import { Issuer } from "./models/issuer.model";

import { ApiBadgeClassAlignment, ApiBadgeClassForCreation, DurationUnitsType } from './models/badgeclass-api.model';
import { BadgeClassManager } from "./services/badgeclass-manager.service";
import { IssuerManager } from "./services/issuer-manager.service";
import { markControlsDirty } from "../common/util/form-util";
import { BadgeStudioComponent } from "./badge-studio.component";
import { BgFormFieldImageComponent } from "../common/components/formfield-image";
import { BadgrApiFailure } from "../common/services/api-failure";
import { UrlValidator } from "../common/validators/url.validator";
import { CommonDialogsService } from "../common/services/common-dialogs.service";
import { BadgeClass } from "./models/badgeclass.model";


@Component({
	selector: 'badgeclass-edit-form',
	template: `
		<form-message></form-message>
		<form class="l-containerhorizontal l-containervertical"
		      [formGroup]="badgeClassForm"
		      (ngSubmit)="onSubmit(badgeClassForm.value)"
		      novalidate
		>
			<!-- General Details Panel -->
			<div class="l-formsection wrap wrap-well" role="group" aria-labelledby="heading-basicinformation">
				<h3 class="l-formsection-x-legend title title-ruled" id="heading-basicinformation">Basic Information</h3>
				<div class="l-formsection-x-container">
					<div class="l-formsection-x-help">
						<h4 class="title title-bordered" id="heading-badgebasics">Badge Basics</h4>
						<p class="text text-small">Badge images can be either PNGs or SVGs. <strong>All fields are required.</strong></p>
						<a class="button button-tertiaryghost" 
						   href="https://support.badgr.io/pages/viewpage.action?pageId=327763"
						   aria-labelledby="heading-badgebasics"
						   target="_blank"
						>Learn More</a>
					</div>
					<div class="l-formsection-x-inputs">
						<div class="l-formimageupload">
							<bg-formfield-image
								#imageField
								label="Image"
								imageLoaderName="badge"
								[newDropZone]="true"
								class="l-formimageupload-x-upload"
								[placeholderImage]="badgeClassPlaceholderImageUrl"
								[control]="badgeClassForm.controls.badge_image"
							>
								<span label-additions>
									<span>(<button type="button" (click)="generateRandomImage()">generate random<span class="visuallyhidden"> badge image</span></button>)</span>
								</span>
							</bg-formfield-image>
							
							<div class="l-formimageupload-x-inputs">
								<badge-studio #badgeStudio [hidden]="true"></badge-studio>

								<bg-formfield-text
									[control]="badgeClassForm.controls.badge_name"
									label="Name"
									[errorMessage]="{ required: 'Please enter a badge name' }"
									[autofocus]="true"
								></bg-formfield-text>

								<bg-formfield-text
									[control]="badgeClassForm.controls.badge_description"
									label="Short Description"
									placeholder="A short summary of this achievement."
									[errorMessage]="{ required: 'Please enter a description' }"
									[multiline]="true"
								></bg-formfield-text>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<!-- Criteria Panel -->
			<div class="l-formsection wrap wrap-well" role="group" aria-labelledby="heading-criteria">
				<h3 class="l-formsection-x-legend title title-ruled" id="heading-criteria">Criteria</h3>
				<div class="l-formsection-x-container">
					<div class="l-formsection-x-help">
						<h4 class="title title-bordered" id="heading-whatscriteria">What are Criteria?</h4>
						<p class="text text-small">
							The criteria field describes exactly what must be done to earn this badge. Some issuers choose a URL on 
							their website as a promotional page that explains this badge opportunity and how to earn it. 
							<strong>At least one field is required.</strong>
						</p>
						<a class="button button-tertiaryghost" 
						   href="https://support.badgr.io/pages/viewpage.action?pageId=327768"
						   aria-labelledby="heading-whatscriteria"
						   target="_blank"
						>Learn More</a>
					</div>
					<div class="l-formsection-x-inputs">
						<p
							[hidden]="!alignmentFieldDirty || !badgeClassForm.hasError('criteriaRequired')"
							class="text text-is-error">Either text or URL is required.</p>
						
						<bg-formfield-markdown
							[control]="badgeClassForm.controls.badge_criteria_text"
							label="How is this Badge Earned?"
							class="l-formsection-x-inputoffset"
							[errorMessage]="''"
						></bg-formfield-markdown>

						<bg-formfield-text
							[control]="badgeClassForm.controls.badge_criteria_url"
							label="URL"
							[urlField]="true"
							fieldType="url"
							errorMessage="URL to the Badge Criteria Page"
						></bg-formfield-text>
					</div>
				</div>
			</div>

			<!-- Alignments Panel -->
			<div class="l-formsection wrap wrap-well"
			     role="group"
			     aria-labelledby="heading-alignment"
			     *ngIf="alignmentsEnabled"
			>
				<h3 class="l-formsection-x-legend title title-ruled" 
				    id="heading-alignment"
				>
					Alignment <span>(optional)</span>
				</h3>
				<div class="l-formsection-x-container">
					<div class="l-formsection-x-help">
						<h4 class="title title-bordered" id="heading-whatsalignment">What's Alignment?</h4>
						<p class="text text-small">
							An Open Badge can optionally align to an educational standard. Alignment 
							information may be relevant to people viewing an earner's awarded badges, or to a potential earner 
							deciding whether to apply for the badge.
						</p>
						<a class="button button-tertiaryghost"
						   href="https://support.badgr.io/pages/viewpage.action?pageId=327768"
						   aria-labelledby="heading-whatsalignment"
						   target="_blank"
						>Learn More</a>
					</div>
					<div class="l-formsection-x-inputs">
						<div class="l-formsectionnested wrap wrap-welldark" *ngFor="let alignment of alignments.controls; let i = index">
							<h5 class="visuallyhidden" id="heading-alignmentsubsection">{{ alignment.controls.target_name.value }}</h5>
							
							<bg-formfield-text
								[control]="alignment.controls.target_name"
								label="Name"
								[errorMessage]="{required:'Please enter an alignment name'}"
								id="alignment_name_{{ i }}"
							></bg-formfield-text>
							
							<bg-formfield-text
								[control]="alignment.controls.target_url"
								label="URL"
								[errorMessage]="{required:'Please enter an alignment URL'}"
								[urlField]="true"
								id="alignment_url_{{ i }}"
							></bg-formfield-text>

							<bg-formfield-text
								[control]="alignment.controls.target_description"
								label="Short Description"
								[multiline]="true"
								id="alignment_description_{{ i }}"
							></bg-formfield-text>
							
							<div class="l-formsectiontoggle">
								<input class="l-formsectiontoggle-x-toggle formsectiontoggle visuallyhidden" 
								       type="checkbox" 
								       id="alignmentAdvancedToggle_{{ i }}" 
								       name="alignmentAdvancedToggle_{{ i }}"
								/>
								<label for="alignmentAdvancedToggle_{{ i }}">
									<span class="formsectiontoggle-x-showtext">Show</span>
									<span class="formsectiontoggle-x-hidetext">Hide</span> 
									Advanced Options
								</label>
								
								<div class="l-formsectiontoggle-x-hidden">
									<bg-formfield-text
										[control]="alignment.controls.target_framework"
										label="Framework"
										id="alignment_target_framework_{{ i }}"
									></bg-formfield-text>
									<bg-formfield-text
										[control]="alignment.controls.target_code"
										label="Code"
										id="alignment_target_code_{{ i }}"
									></bg-formfield-text>
								</div>
							</div>
							<button class="l-formsectionnested-x-remove formsectionremove" 
							        aria-labelledby="heading-alignmentsubsection" 
							        (click)="removeAlignment(alignment)"
							        *ngIf="alignments.length > 1"
							        type="button"
							>Remove</button>
						</div>
						<button class="buttonicon buttonicon-add" type="button" (click)="addAlignment()">Add Another</button>
					</div>
				</div>
				<button class="l-formsection-x-remove formsectionremove" 
				        aria-labelledby="heading-alignment" 
				        (click)="disableAlignments()"
				        type="button"
				>Remove</button>
			</div>
			
			<!-- Tags Panel -->
			<div class="l-formsection wrap wrap-well" role="group" aria-labelledby="heading-tags" *ngIf="tagsEnabled">
				<h3 class="l-formsection-x-legend title title-ruled" id="heading-tags">Tags</h3>
				<div class="l-formsection-x-container">
					<div class="l-formsection-x-help">
						<h4 class="title title-bordered" id="heading-whataretags">What are Tags?</h4>
						<p class="text text-small">
							Tags are optional ways to describe a type of achievement. When you use tags, you help people who are 
							interested in your topic find your Badge.
						</p>
						<a class="button button-tertiaryghost"
						   href="https://support.badgr.io/pages/viewpage.action?pageId=327768"
						   aria-labelledby="heading-whataretags"
						   target="_blank"
						>Learn More</a>
					</div>
					<div class="l-formsection-x-inputs">
						<ul class="l-tags">
							<li *ngFor="let tag of tags">
								<div class="tag">
									<span class="tag-x-text">{{ tag }}</span>
									<button type="button" (click)="removeTag(tag)">Remove {{ tag }} tag</button>
								</div>
							</li>
						</ul>
						<div class="l-formsection-x-maxwidthinput formfield">
							<label for="formfield">Add a Tag</label>
							<div class="formaddinput">
								<label class="visuallyhidden" for="addtag" id="formaddinput-addtag">Tag</label>
								<input type="text" name="addtag" id="addtag" (keypress)="handleTagInputKeyPress($event)" #newTagInput>
								<button aria-labelledby="formaddinput-addtag" 
								        type="button" 
								        (click)="addTag()"
								>Add</button>
							</div>
						</div>
					</div>
				</div>
				<button class="l-formsection-x-remove formsectionremove" 
				        aria-labelledby="heading-tags" 
				        type="button"
				        (click)="disableTags()"
				>Remove</button>
			</div>

			<!-- Expiration Panel -->
			<div class="l-formsection wrap wrap-well" role="group" aria-labelledby="heading-tags" *ngIf="expirationEnabled">
				<h3 class="l-formsection-x-legend title title-ruled" id="heading-tags">Expiration</h3>
				<div class="l-formsection-x-container">
					<div class="l-formsection-x-help">
						<h4 class="title title-bordered" id="heading-whataretags">Badge Expiration?</h4>
						<p class="text text-small">
						Add the duration this badge is generally valid for. This can also be changed at the time of award. Badges will be marked as expired after expiration.
						</p>
						<a class="button button-tertiaryghost"
						   href="https://support.badgr.io/pages/viewpage.action?pageId=327768"
						   aria-labelledby="heading-whataretags"
						   target="_blank"
						>Learn More</a>
					</div>
					<div class="l-formsection-x-inputs">
	
						<div class="formfield">
							<label>How long is this award valid?</label>
							<div class="l-formtwoup">
								<bg-formfield-text [control]="badgeClassForm.controls.expiration_duration_value"
								></bg-formfield-text>
								<bg-formfield-select ariaLabel="Select Duration Unit"
								                     [control]="badgeClassForm.controls.expiration_duration_unit"
								                     [optionMap]="durationUnitsMap"
								></bg-formfield-select>
							</div>
						</div>

					</div>
				</div>
				<button class="l-formsection-x-remove formsectionremove" 
				        aria-labelledby="heading-tags" 
				        type="button"
				        (click)="disableExpiration()"
				>Remove</button>
			</div>
			
			<!-- Footer -->
			<div class="l-formsection l-formsection-span wrap wrap-well" role="group" aria-labelledby="heading-addoptionaldetails">
				<!-- Optional Detail Enable Panel -->
				<h3 class="l-formsection-x-legend title title-ruled title-ruledadd" id="heading-addoptionaldetails">Add Optional Details</h3>
				<div class="l-formsection-x-container">
					<div class="l-formsection-x-inputs">
						<div class="l-squareiconcards">
							<button class="squareiconcard squareiconcard-alignment"
							        type="button"
							        (click)="enableAlignments()"
							        [disabled]="alignmentsEnabled"
							>
								<span class="squareiconcard-x-container">Alignment</span>
							</button>
							<button class="squareiconcard squareiconcard-tags"
							        type="button"
							        (click)="enableTags()"
							        [disabled]="tagsEnabled"
							>
								<span class="squareiconcard-x-container">Tags</span>
							</button>
							<button class="squareiconcard squareiconcard-expiration"
							        type="button"
							        (click)="enableExpiration()"
							        [disabled]="expirationEnabled"
							>
								<span class="squareiconcard-x-container">Expiration</span>
							</button>
						</div>
					</div>
				</div>

			</div>
			<hr class="rule l-rule">
			<div class="l-childrenhorizontal l-childrenhorizontal-right">
				<button
				   class="button button-primaryghost"
				   type="button"
				   [disabled-when-requesting]="true"
				   (click)="cancelClicked()"
				>Cancel</button>
				<button
					type="submit"
					class="button"
					[disabled]="!! savePromise"
					[loading-promises]="[ savePromise ]"
					loading-message="{{ submittingText }}"
					(click)="submitClicked($event)"
				>{{ submitText }}</button>
			</div>
		</form>
	`
})
export class BadgeClassEditFormComponent extends BaseAuthenticatedRoutableComponent implements OnInit {
	readonly badgeClassPlaceholderImageUrl = require('../../breakdown/static/images/placeholderavatar.svg');

	savePromise: Promise<BadgeClass> | null = null;
	badgeClassForm: FormGroup;

	@ViewChild("badgeStudio")
	badgeStudio: BadgeStudioComponent;

	@ViewChild("imageField")
	imageField: BgFormFieldImageComponent;

	@ViewChild("newTagInput")
	newTagInput: ElementRef;

	existingBadgeClass: BadgeClass | null = null;

	@Output()
	save = new EventEmitter<Promise<BadgeClass>>();

	@Output()
	cancel = new EventEmitter<void>();

	@Input()
	issuerSlug: string;

	@Input()
	submitText: string;

	@Input()
	submittingText: string;

	@Input()
	set badgeClass(badgeClass: BadgeClass) {
		if (this.existingBadgeClass != badgeClass) {
			this.existingBadgeClass = badgeClass;
			this.initFormFromExisting();
		}
	}

	get badgeClass() {
		return this.existingBadgeClass;
	}

	constructor(
		sessionService: SessionService,
		router: Router,
		route: ActivatedRoute,
		protected fb: FormBuilder,
		protected title: Title,
		protected messageService: MessageService,
		protected issuerManager: IssuerManager,
		protected badgeClassManager: BadgeClassManager,
		protected dialogService: CommonDialogsService
	) {
		super(router, route, sessionService);
		title.setTitle("Create Badge Class");

		this.badgeClassForm = fb.group({
			badge_name: [
				'',
				Validators.compose([
					Validators.required,
					Validators.maxLength(255)
				])
			],
			badge_image: ['', Validators.required],
			badge_description: ['', Validators.required],
			badge_criteria_url: [''],
			badge_criteria_text: [''],
			alignments: fb.array([]),
			expiration_duration_value: [null],
			expiration_duration_unit: [""]
		} as BasicBadgeForm<any[], FormArray>, {
				validator: this.criteriaRequired
			});
	}

	initFormFromExisting() {
		const badgeClass = this.existingBadgeClass;

		this.badgeClassForm = this.fb.group({
			badge_name: [
				badgeClass.name,
				Validators.compose([
					Validators.required,
					Validators.maxLength(255)
				])
			],
			badge_image: [badgeClass.image, Validators.required],
			badge_description: [badgeClass.description, Validators.required],
			badge_criteria_url: [badgeClass.criteria_url],
			badge_criteria_text: [badgeClass.criteria_text],
			expiration_duration_value: [badgeClass.expirationDurationValue],
			expiration_duration_unit: [badgeClass.expirationDurationUnit],
			alignments: this.fb.array(this.badgeClass.alignments.map(alignment => this.fb.group({
				target_name: [alignment.target_name, Validators.required],
				target_url: [alignment.target_url, Validators.compose([Validators.required, UrlValidator.validUrl])],
				target_description: [alignment.target_description],
				target_framework: [alignment.target_framework],
				target_code: [alignment.target_code],
			} as AlignmentFormGroup<any[]>)))
		} as BasicBadgeForm<any[], FormArray>, {
				validator: this.criteriaRequired
			});

		this.tags = new Set();
		this.badgeClass.tags.forEach(t => this.tags.add(t));

		this.tagsEnabled = this.tags.size > 0;
		this.alignmentsEnabled = this.badgeClass.alignments.length > 0;
	}

	ngOnInit() {
		super.ngOnInit();
	}

	get formControls(): BasicBadgeForm<FormControl, FormArray> {
		return this.badgeClassForm.controls as any;
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Tags
	tagsEnabled = false;
	tags = new Set<string>();

	enableTags() {
		this.tagsEnabled = true;
	}

	disableTags() {
		this.tagsEnabled = false;
	}

	addTag() {
		const newTag = ((this.newTagInput.nativeElement as HTMLInputElement).value || "").trim().toLowerCase();

		if (newTag.length > 0) {
			this.tags.add(newTag);
			(this.newTagInput.nativeElement as HTMLInputElement).value = "";
		}
	}

	handleTagInputKeyPress(event: KeyboardEvent) {
		if (event.keyCode == 13 /* Enter */) {
			this.addTag();
			(this.newTagInput.nativeElement as HTMLInputElement).focus();
			event.preventDefault();
		}
	}

	removeTag(tag: string) {
		this.tags.delete(tag);
	}
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Expiration
	expirationEnabled = false;


	durationUnitsMap: {[key in DurationUnitsType]: string} = {
		days: "Days",
		weeks: "Weeks",
		months: "Months",
		years: "Years"
	}

	enableExpiration() {
		this.expirationEnabled = true;
	}

	disableExpiration() {
		this.expirationEnabled = false;
	}
	get expiration() {
		return this.badgeClassForm.controls["expiration"] as FormControl;
	}


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Alignments
	alignmentsEnabled = false;
	savedAlignments: AbstractControl[] = null;

	get alignments() {
		return this.badgeClassForm.controls["alignments"] as FormArray;
	}

	enableAlignments() {
		this.alignmentsEnabled = true;
		if (this.savedAlignments) {
			this.savedAlignments.forEach(a => this.alignments.push(a));
			this.savedAlignments = null;
		}
		if (this.alignments.length == 0) {
			this.addAlignment();
		}
	}

	addAlignment() {
		const group = this.fb.group({
			target_name: ['', Validators.required],
			target_url: ['', Validators.compose([Validators.required, UrlValidator.validUrl])],
			target_description: [''],
			target_framework: [''],
			target_code: [''],
		} as AlignmentFormGroup<any[]>);

		this.alignments.push(group);
	}

	disableAlignments() {
		this.alignmentsEnabled = false;

		// Save the alignments so that they aren't validated after being removed, but can be restored if the user chooses to enable alignments again
		this.savedAlignments = this.alignments.controls.slice();
		while (this.alignments.length > 0)
			this.alignments.removeAt(0);
	}

	async removeAlignment(alignment: FormGroup) {
		const controls: AlignmentFormGroup<FormControl> = alignment.controls as any;

		if (controls.target_name.value.trim().length > 0
			|| controls.target_url.value.trim().length > 0
			|| controls.target_description.value.trim().length > 0
			|| controls.target_framework.value.trim().length > 0
			|| controls.target_code.value.trim().length > 0
		) {
			if (! await this.dialogService.confirmDialog.openTrueFalseDialog({
				dialogTitle: "Remove Alignment?",
				dialogBody: "Are you sure you want to remove this alignment? This action cannot be undone.",
				resolveButtonLabel: "Remove Alignment",
				rejectButtonLabel: "Cancel"
			})) return;
		}

		this.alignments.removeAt(this.alignments.controls.indexOf(alignment));
	}


	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	criteriaRequired(formGroup: FormGroup): { [id: string]: boolean } | null {
		const controls: BasicBadgeForm<FormControl, FormArray> = formGroup.controls as any;

		return ((controls.badge_criteria_url.value || "").trim().length || (controls.badge_criteria_text.value || "").trim().length)
			? null
			: { 'criteriaRequired': true };
	}

	get alignmentFieldDirty() {
		return this.formControls.badge_criteria_text.dirty || this.formControls.badge_criteria_url.dirty;
	}

	async onSubmit(formState: BasicBadgeForm<string, ApiBadgeClassAlignment[]>) {
		if (this.existingBadgeClass) {
			this.existingBadgeClass.name = formState.badge_name;
			this.existingBadgeClass.description = formState.badge_description;
			this.existingBadgeClass.image = formState.badge_image;
			this.existingBadgeClass.criteria_text = formState.badge_criteria_text;
			this.existingBadgeClass.criteria_url = formState.badge_criteria_url;
			this.existingBadgeClass.alignments = this.alignmentsEnabled ? formState.alignments : [];
			this.existingBadgeClass.tags = this.tagsEnabled ? Array.from(this.tags) : [];
			this.existingBadgeClass.expirationDurationUnit = formState.expiration_duration_unit as DurationUnitsType;
			this.existingBadgeClass.expirationDurationValue = parseInt(formState.expiration_duration_value) || undefined;
			this.savePromise = this.existingBadgeClass.save();
		} else {
			const badgeClassData = {
				name: formState.badge_name,
				description: formState.badge_description,
				image: formState.badge_image,
				criteria_text: formState.badge_criteria_text,
				criteria_url: formState.badge_criteria_url,
				tags: this.tagsEnabled ? Array.from(this.tags) : [],
				alignment: this.alignmentsEnabled ? formState.alignments : [],
				expiration_duration_unit: formState.expiration_duration_unit as DurationUnitsType,
				expiration_duration_value: parseInt(formState.expiration_duration_value) || undefined
			} as ApiBadgeClassForCreation;

			this.savePromise = this.badgeClassManager.createBadgeClass(this.issuerSlug, badgeClassData);
		}

		this.save.emit(this.savePromise);
	}

	submitClicked(ev: Event) {
		if (!this.badgeClassForm.valid) {
			ev.preventDefault();
			markControlsDirty(this.badgeClassForm);

			// fire on next cycle, otherwise the immediate click event will dismiss the formmessage before its viewed
			setTimeout(() => {
				window.scrollTo(0, 0);
				this.messageService.reportHandledError("There were errors in your submission. Please review and try again.")
			});
		}
	}

	cancelClicked() {
		this.cancel.emit();
	}

	generateRandomImage() {
		this.badgeStudio.generateRandom().then(imageUrl => this.imageField.useDataUrl(imageUrl, "Auto-generated image"))
	}
}

interface AlignmentFormGroup<T> {
	target_name: T;
	target_url: T;
	target_description: T;
	target_framework: T;
	target_code: T;
}

interface BasicBadgeForm<BasicType, AlignmentsType> {
	badge_name: BasicType;
	badge_image: BasicType;
	badge_description: BasicType;
	badge_criteria_url: BasicType;
	badge_criteria_text: BasicType;
	alignments: AlignmentsType;
	expiration_duration_value: BasicType;
	expiration_duration_unit: BasicType;
}

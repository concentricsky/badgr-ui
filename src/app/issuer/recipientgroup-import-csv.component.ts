import { Component, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, FormArray, Validators } from "@angular/forms";
import { Router, ActivatedRoute } from "@angular/router";
import { SessionService } from "../common/services/session.service";
import { MessageService } from "../common/services/message.service";
import { Title } from "@angular/platform-browser";
import { Issuer } from "./models/issuer.model";
import { IssuerManager } from "./services/issuer-manager.service";
import { BaseAuthenticatedRoutableComponent } from "../common/pages/base-authenticated-routable.component";
import { RecipientGroupManager } from "./services/recipientgroup-manager.service";
import { RecipientGroup } from "./models/recipientgroup.model";
import { EmailValidator } from "../common/validators/email.validator";

//import "rxjs/add/observable/combineLatest";
//import "rxjs/add/operator/first";

type DestSelectOptions = "first" | "last" | "middleInitial" | "name" | "email" | "NA";
type ViewState = "instructions" | "importPreview" | "importError" | "importConformation";
type ButtonLabel = "import" | "import members" | "continue";
type ButtonAction = () =>void;

@Component({
	selector: 'Recipientgroup-import-csv',
	template: `
			<main *bgAwaitPromises="[issuerLoaded, recipientGroupLoaded]">
			<form-message></form-message>
			<!-- Breadcrumb -->
			<header class="wrap wrap-light l-containerhorizontal l-heading">
				<nav>
					<h1 class="visuallyhidden">Breadcrumbs</h1>
					<ul class="breadcrumb">
						<li><a [routerLink]="['/issuer']">Issuers</a></li>
						<li *ngIf="issuer"><a [routerLink]="['/issuer/issuers', issuerSlug]">{{ issuer.name }}</a></li>
						<li *ngIf="issuer && recipientGroup"><a [routerLink]="['/issuer/issuers', issuerSlug, 'recipient-groups', recipientGroup.slug]">Group: {{ recipientGroup.name }}</a></li>
						<li class="breadcrumb-x-current">Import CSV</li>
					</ul>
				</nav>
				<div class="heading">
					<div class="heading-x-text">
						<h1>Import Members</h1>
					</div>
				</div>
			</header>
				
			<section class="wrap l-containerhorizontal">
	                
	            <div *ngIf="viewState === 'instructions'">
				    <!-- import heading-->
				    <article class="importHeading">
						<h1 class=title>Instructions</h1>
						<p>
							You may import new or existing members to your group. Your file must meet the following requirements:
						</p>
						<ul>
							<li>Contains name and email address</li>
							<li>CSV or TXT format only.</li>
						</ul>
						<p>
							Use this 
							<a [href]="badgrImportMembersTemplateUrl" download="import-members.csv">
								Sample Template
							</a> 
							to create a CSV or TXT file for importing members.
						</p>
					</article>
					<form [formGroup]="csvForm" 
						  class="l-maxWidth">
						<fieldset>
							<bg-formfield-file #fileField
											    label="File"
											    validFileTypes="text/plain,.csv"
											    [control]="csvForm.controls.file"
											    [placeholderImage]="csvUploadImageUrl"
											    (fileData) = onFileDataRecived($event)>
							</bg-formfield-file>
						</fieldset>
					</form>
				</div>
			
				<!---------------------  
					ViewState  : importPreview
			        Styleguide : Import Members - Select Categories 
				----------------------->
				<div *ngIf="viewState === 'importPreview'"
					 class="select-csvUpload"
				>
					<div class="importHeading">
					  <h1 class=title>Map CSV Columns</h1>
					  <p *ngIf="importPreviewData?.rows">
						  Below is a preview of the first 
						  {{ (importPreviewData.rows.length < MAX_ROWS_TO_DISPLAY) ? importPreviewData.rows.length : MAX_ROWS_TO_DISPLAY}} 
						  of {{importPreviewData.rows.length}} rows in your file.
						  
						  For each column in the table below, choose the heading from the dropdown that matches the data in your CSV. 
					  </p>
					</div>
					<table class="table table-import">
						<thead>
							<tr>
								<th scope="col" *ngFor="let columnHeaderName of importPreviewData.columnHeaders; let columnId = index;">
									<label class="select select-inputonly select-import">
										<span>Sort by</span>
										<select name="select"
												[id]= "'select'+columnId"
												#selectDest
												[value] = columnHeaderName.destColumn
												(change)="mapDestNameToSourceName(columnId,selectDest.value)">
											
											<option value="NA">N/A</option>
											<option value="first">First Name</option>
											<option value="last">Last Name</option>
											<option value="middleInitial">Middle initial</option>
											<option value="name">Full Name</option>
											<option value="email">Email</option>
										</select>
									</label>
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td *ngFor="let columnHeaderName of importPreviewData.columnHeaders">
									{{ columnHeaderName.sourceName }}
								</td>
							</tr>
							<tr *ngFor="let row of importPreviewData?.rows.slice(0,MAX_ROWS_TO_DISPLAY)">
								<td *ngFor="let cell of row">
									{{ cell}} 
								</td>
								<ng-template [ngIf]="row.length < columnHeadersCount">
									<td *ngFor="let spacer of createRange(columnHeadersCount-row.length)"></td>
								</ng-template>
							</tr>
						</tbody>
					</table>
				</div>			
						
				<!---------------------  
					ViewState  : importConformation
					Styleguide : Import Members - Import preview 
				----------------------->
				<div *ngIf="viewState === 'importConformation'">
					<div class="importHeading">
					  <h1 class=title>Import Preview</h1>
					  <p>
					    {{validRowsTransformed.size}} Rows ready to be imported. {{duplicateRecords.length}} rows were 
					    found to be duplicates and will be ignored. Click the IMPORT MEMBERS button below to issue this badge
					  </p>
					</div>
					
					<table class="table table-issues">
						<thead>
							<tr>
								<th scope="col">Name</th>
								<th scope="col">Email</th>
								<th><!-- header for remove link--></th>
							</tr>
						</thead>
						<tbody>
							<tr *ngFor="let row of validRowsTransformed">
								<td class="table-issues-x-confirmation table-issues-x-confirmationText">
									{{row.name}}
								</td>
								<td class="table-issues-x-confirmation table-issues-x-confirmationText">
									{{row.email}}
								</td>
								<td>
									<button class="button button-primaryghost" 
										(click)="removeValidRowsTransformed(row)"
									>REMOVE</button>
								</td>
							</tr>
						<tbody> 
					</table>
				</div>	
					
				<!---------------------  
					ViewState  : importError
			        Styleguide : Import Members - Import Issues
				----------------------->
				<div *ngIf="viewState === 'importError'">
				<div class="importHeading">
					  <h1 class=title>Import Errors</h1>
					  <p>
					    {{validRowsTransformed.size}} rows will be imported. The following {{invalidRowsTransformed.length}} contain errors. Please fix the errors below or select REMOVE.					    
					  </p>
					</div>
			
					<form [formGroup]="importErrorForm">
	
						<table formArrayName="users"
							   class="table table-issues">
							<thead>
								<tr>
									<th scope="col">Name</th>
									<th scope="col">Email</th>
									<th><!-- header for remove link--></th>
								</tr>
							</thead>
							<tbody>
							<tr *ngFor="let user of importErrorForm.controls.users.controls; let i=index">
	                            <td class="table-issues-x-confirmationText">
									<bg-formfield-text 
											(focusout)= "errorStateInputOnFocusOut()"
											[control]="importErrorForm.controls.users.controls[i].controls.name"
							                [errorMessage]="{required:'Please enter a name'}"
					                ></bg-formfield-text>	
	                            </td>
	                            <td class="table-issues-x-confirmationText">
									<bg-formfield-text 
											(focusout)= "errorStateInputOnFocusOut()"
											[control]="importErrorForm.controls.users.controls[i].controls.email"
	                                        [errorMessage]="{ required: 'Please enter an email',
		                                                       invalidEmail: 'Please enter a valid email'}"
	                                ></bg-formfield-text>
	                            </td>
								<td>
									<button class="button button-primaryghost" 
											(click)="removeButtonErrorState(i)"
									>REMOVE</button>
								</td>
							</tr>
							<tbody> 
						</table>
					</form>				
				</div>			

				<!-- BUTTONS -->				
				<div class="l-display-flex l-childrenhorizontal-right l-marginTop-4x l-marginBottom-4x"
					 [class.l-maxWidth]= "viewState === 'instructions'">
					<button 
						class="button button-primaryghost" 
						(click)="cancelButtonAction($event)"
					>cancel</button>						   		  
					
					<button
						class="button l-marginLeft-x2"
						[class.button-is-disabled]=buttonDisabledClass
						[attr.disabled] = buttonDisabledAttribute
						(click)="buttonAction($event)"	
					>{{ buttonLabel }}</button>
			    </div>
			</section>
			<div *ngIf="rowIsLongerThanHeader">
				<div class="l-formmessage formmessage formmessage-is-error formmessage-is-active">
				    <p>
				      The CSV uploaded contains row lengths longer then its header lengths. Please correct this error and try again.
				    </p>
				    <!--<button type="button" (click)="rowIsLongerThanHeader = false">Dismiss</button>-->
				</div>
			</div>
		</main>
	`,

})

export class RecipientGroupImportCSV extends BaseAuthenticatedRoutableComponent  implements OnInit {
	readonly badgrImportMembersTemplateUrl = require('../../breakdown/static/badgrImportMembersTemplate.csv');
	readonly csvUploadImageUrl = require('../../breakdown/static/images/csvuploadicon.svg');

	MAX_ROWS_TO_DISPLAY:number = 5;

	buttonAction:ButtonAction;
	buttonDisabledClass = true;
	buttonDisabledAttribute = true;
	buttonLabel:ButtonLabel;
	cancelButtonAction:ButtonAction;
	columnHeadersCount:number;
	csvForm:FormGroup;
	destNameToColumnHeaderMap:{
		[destColumnName: string]: number
	};
	duplicateRecords:RecipientGroupImportData[]=[];
	importErrorForm:FormGroup;
	importPreviewData:RecipientGroupImportPreviewData;
	invalidRowsTransformed = Array<RecipientGroupImportData>();
	issuer: Issuer;
	rawCsv:string = null;
	issuerLoaded: Promise<any>;
	recipientGroupLoaded: Promise<any>;
	recipientGroup: RecipientGroup;
	rowIsLongerThanHeader: boolean = false;
	validDestHeaderNameElements: DestSelectOptions[] = [ "first", "last", "middleInitial", "email"];
	validRowsTransformed = new Set<RecipientGroupImportData>();
	viewState:ViewState = "instructions";



	constructor (
		protected formBuilder: FormBuilder,
		protected loginService: SessionService,
		protected messageService: MessageService,
		protected recipientGroupManager: RecipientGroupManager,
		protected issuerManager: IssuerManager,
		protected route: ActivatedRoute,
		protected router: Router,
		protected title: Title
	)
	{
		super(router, route, loginService);

		title.setTitle("Recipient Group CSV upload - Badgr");

		this.activateViewState("instructions");

		this.issuerLoaded = issuerManager.issuerBySlug(this.issuerSlug).then(
			issuer => this.issuer = issuer,
			error => messageService.reportAndThrowError(`Failed to load issuer ${this.issuerSlug}`, error)
		);

		this.recipientGroupLoaded = recipientGroupManager.recipientGroupSummaryFor(
			this.issuerSlug,
			this.groupSlug
		).then(s => s.detailLoadedPromise).then(
			group => this.recipientGroup = group,
			error => messageService.reportAndThrowError(`No Such Recipient Group ${this.issuerSlug} / ${this.groupSlug}`, error)
		);
		this.csvForm = formBuilder.group({
			file:[]
		} as importCsvForm<any[]>)

	}

	ngOnInit() {
		super.ngOnInit();
	}

	//////// configuration ////////
	get groupSlug() {
		return this.route.snapshot.params['groupSlug'];
	}

	get issuerSlug() {
		return this.route.snapshot.params['issuerSlug'];
	}

	 initImportErrorForm(){
		const createFormArray = () =>{
			let formArray = [];

			this.invalidRowsTransformed.forEach(row =>{
				formArray.push(
					this.formBuilder.group(
						{
							name: [row.name,
							       Validators.compose(
							       	[
										Validators.required,
									    Validators.maxLength(254)
									])
							],
							email: [row.email,
							        Validators.compose(
					                [
										Validators.required,
										EmailValidator.validEmail
									])
							]
						}
					)
				)
			})
			return formArray;
		}

		 this.importErrorForm = this.formBuilder.group({
			 users: this.formBuilder.array(
				 createFormArray()
		     )
		 })
	}

	onFileDataRecived(data){
		this.rawCsv = data;
		this.enableActionButton();
	}

	//////// Maintaining State ////////
	activateViewState(state:ViewState){

		this.viewState = state;

		switch (state){

			case "instructions":
				this.disableActionButton();
				this.buttonLabel = "import";
				this.cancelButtonAction = ()=>{this.navigateToIssuer()};
				this.buttonAction = ()=>{
					this.parseCsv(this.rawCsv);
					this.activateViewState("importPreview");
				};
				break;

			case "importPreview":
				this.disableActionButton();
				if( !this.rowIsLongerThanHeader ){
					this.areNameAndEmailColumnHeadersMapped();
					this.buttonLabel = "continue";
					this.cancelButtonAction = ()=>{ this.resetView()};
					this.buttonAction = ()=> {
						this.generateImportPreview();
						if(this.importPreviewData.invalidRows.length === 0
							&&
							this.invalidRowsTransformed.length === 0)
						{
							this.activateViewState("importConformation");
						}
						else
						{
							this.activateViewState("importError");
						}
					};
				}
				break;

			case "importConformation":
				this.buttonLabel = "import members";
				this.cancelButtonAction = () =>{ this.resetView()};
				this.buttonAction = ()=>{ this.recipientGroupMebersBulkAdd() };
				break;

			case "importError":
				this.buttonLabel = "continue";
				this.initImportErrorForm();
				this.markFormControllsAsDirty();
				this.cancelButtonAction = ()=>{ this.resetView()};
				this.buttonAction = ()=>{
					this.errorStateButtonAction()
				};
				break;
		}
	}

	disableActionButton(){
		this.buttonDisabledClass = true;
		this.buttonDisabledAttribute = true;
	}

	enableActionButton(){
		this.buttonDisabledClass = false;
		this.buttonDisabledAttribute = null;
	}

	resetView(){
		this.rawCsv = null;
		this.duplicateRecords = [];
		this.validRowsTransformed.clear();
		this.invalidRowsTransformed = [];
		this.disableActionButton();
		this.activateViewState("instructions");
	}


	//////// Parsing ////////
	parseCsv(rawCSV:string) {

		// helper functions //
		const generateColumnHeaders = ():ColumnHeaders[] => {
			let columnHeaders = [];
			let inferredColumnHeaders = new Set<string>();
			let nameElements:DestSelectOptions[] = ["first","last","middleInitial"];

			rows
				.shift()
				.forEach( (columnHeaderName:string) => {
					let tempColumnHeaderName:string = columnHeaderName.toLowerCase();
					let cannotInfer:boolean = false;
					let rootNameElement:DestSelectOptions;

					if(tempColumnHeaderName == 'name'){
						for(let i=0; i < inferredColumnHeaders.size; ++i){
							if(inferredColumnHeaders.has(nameElements[i]) ){
								cannotInfer = true;
								break;
							}
						}
					}
					else {
						//Determine the root name element this column header is derived from.
						nameElements.forEach(nameElement => {

							if(tempColumnHeaderName.includes(nameElement)){
								// First, last, or middle intial can only be inferred if name hasn't already been inferred.
								if(inferredColumnHeaders.has("name")){
									cannotInfer = true;
								}
								else{
									rootNameElement = nameElement;
								}
							}
						})
						// found rootNameElement - has it been inferred yet?
						if(rootNameElement){
							cannotInfer = inferredColumnHeaders.has(rootNameElement);
						}
					}

					columnHeaders
						.push(
							{ destColumn: cannotInfer ? "NA" : inferDestColumn(tempColumnHeaderName),
								sourceName: columnHeaderName
							})

					inferredColumnHeaders.add(rootNameElement?rootNameElement:tempColumnHeaderName);
				});

			return columnHeaders;
		}

		const inferDestColumn = (sourceColumnHeaderName: string): DestSelectOptions => {
			let result:DestSelectOptions = "NA";

			if (sourceColumnHeaderName.toLowerCase() == "name") { return "name"}

			this.validDestHeaderNameElements.forEach(destName => {
				if (sourceColumnHeaderName.indexOf(destName.toLowerCase()) > -1) {
					result = destName;
				}
			});
			return result;
		}

		const padRowWithMissingCells =
			(row: string[]) => row.concat(this.createRange(this.columnHeadersCount - row.length));

		const parseRow = (rawRow: string) => {
			rows.push(
				rawRow.split(',')
					.map(r => r.trim())
			)
		};

		// start the actual parsing. //
		let rows = [];
		let	validRows:string[][] = [];
		let invalidRows:string[][] = [];

		rawCSV.match(/[^\r\n]+/g)
			.forEach(row => parseRow(row));

		let columnHeaders: ColumnHeaders[] = generateColumnHeaders();

		this.columnHeadersCount = columnHeaders.length;

		//If a data row is longer then the header notify the user and block any additional processing.
		this.rowIsLongerThanHeader =  rows.some( row => row.length > this.columnHeadersCount );

		rows.forEach( row => {
			if(row.length < this.columnHeadersCount){
				invalidRows.push(padRowWithMissingCells(row));
			}
			else{
				validRows.push(row)
			}
		})

		this.importPreviewData = {
			columnHeaders:columnHeaders,
			rows:rows,
			validRows:validRows,
			invalidRows: invalidRows
		} as RecipientGroupImportPreviewData
	}

	//////// Generating import data ////////
	generateImportPreview(){
		this.generateDestNameToColumnHeaderMap();
		this.transformInvalidRows();
		this.transformValidRows();
		this.validateTransformedEmail();
		this.removeDuplicateEmails();
	}


	//////// Generating import data helpers ////////
	areNameAndEmailColumnHeadersMapped(){
		//check to see if the continue button can be unlocked
		let nameElements = ["name","first","last","middleInitial"];
		let containsNameElement:Boolean = false;
		let containsEmailElement:Boolean = false;

		for(let i = 0; i < this.importPreviewData.columnHeaders.length; i++){

			let elementIndex = nameElements.findIndex(nameElement =>{
				return nameElement === this.importPreviewData.columnHeaders[i].destColumn
			});

			if(elementIndex > -1){
				containsNameElement = true;
				break;
			};
		}

		for(let j = 0; j < this.importPreviewData.columnHeaders.length; j++){
			if(this.importPreviewData.columnHeaders[j].destColumn == "email"){
				containsEmailElement = true;
				break;
			}
		}
		containsNameElement && containsEmailElement ? this.enableActionButton() : this.disableActionButton();
	}

	generateDestNameToColumnHeaderMap(){
		this.destNameToColumnHeaderMap = {};
		Object
			.keys(this.importPreviewData.columnHeaders)
			.forEach(key => {
				if(this.importPreviewData.columnHeaders[ key ].destColumn != "NA"){
					this.destNameToColumnHeaderMap[ this.importPreviewData.columnHeaders[ key ].destColumn ] = Number(key);
				}
			})
	}

	getCellFromRowByDestName(destName:string, row:Object) {
		return row[this.destNameToColumnHeaderMap[destName]];
	}

	getEmailFromRow(row) {
		return this.getCellFromRowByDestName('email', row);
	}

	getNameFromRow(row){
		if (this.importPreviewDataHasDestName('name') ){
			return this.getCellFromRowByDestName('name', row);
		} else {
			return ['first', 'middleInitial', 'last']
				.filter(field => this.importPreviewDataHasDestName(field as DestSelectOptions))
				.map(field => this.getCellFromRowByDestName(field, row))
				.filter(value => value && value.length > 0)
				.join(" ");
		}
	}

	importPreviewDataHasDestName(destName:DestSelectOptions):boolean{
		return this.destNameToColumnHeaderMap.hasOwnProperty(destName);
	}

	mapDestNameToSourceName(columnHeaderId:number, selected:DestSelectOptions){
		Object.keys(this.importPreviewData.columnHeaders)
			.forEach( columnId => {
				if (columnId !== columnHeaderId.toString()
					&&
					this.importPreviewData.columnHeaders[ columnId ].destColumn === selected
				)
				{
					this.importPreviewData.columnHeaders[ columnId ].destColumn = "NA";
				}

				if (columnId === columnHeaderId.toString())
				{
					this.importPreviewData.columnHeaders[ columnId ].destColumn = selected;
				}
			})
		this.areNameAndEmailColumnHeadersMapped()
	}

	removeDuplicateEmails(){
		let tempRow = new Set<string>();
		this.validRowsTransformed.forEach( row => {
			if( tempRow.has(row.email.trim())){
				this.duplicateRecords.push(row);
				this.validRowsTransformed.delete(row);
			}
			else{
				tempRow.add(row.email.trim());
			}
		})
	}

	transformInvalidRows(){
		this.importPreviewData.invalidRows
			.forEach((row) => {
				this.invalidRowsTransformed
					. push(
						{
							name:this.getNameFromRow(row),
							email:this.getEmailFromRow(row)
						}
					)
			});
	}

	transformValidRows(){
		this.importPreviewData.validRows
			.forEach((row) => {
				this.validRowsTransformed
					.add(
						{
							name: this.getNameFromRow(row),
							email: this.getEmailFromRow(row)
						}
					)
			})
	}

	validateTransformedEmail(){
		this.validRowsTransformed.forEach( row => {
			if (! row.email.match(/^\S+@\S+\.\S{2,}$/)){
				this.invalidRowsTransformed.push(row);
				this.validRowsTransformed.delete(row)
			}
		})
	}

	//////// form actions / helpers  ////////
	createRange(size:number){
		let items: string[] = [];
		for(let i = 1; i <= size; i++){
			items.push("");
		}
		return items;
	}

	errorStateButtonAction(){
		if (!this.importErrorForm.valid){
			this.markFormControllsAsDirty();
		}
		else{
			this.importErrorForm.value["users"].forEach(row =>{
				this.validRowsTransformed
					.add(
						{
							name: row["name"].trim(),
							email: row["email"].trim()
						}
					)
			})
			this.removeDuplicateEmails();
			this.activateViewState("importConformation");
		}
	}

	errorStateInputOnFocusOut(event:FocusEvent){;
		if (!this.importErrorForm.valid){
			this.markFormControllsAsDirty();
		}
		else{
			this.errorStateButtonAction();
		}
	}

	navigateToIssuer(){
		this.router.navigate(['/issuer/issuers', this.issuerSlug,"recipient-groups",this.groupSlug])
	}

	markFormControllsAsDirty(){
		let formArray:FormArray = <FormArray>this.importErrorForm.controls["users"];

		formArray.controls.forEach((group:FormGroup) =>{
			Object.getOwnPropertyNames(group.controls).forEach(controlName =>{
				group.controls[controlName].markAsDirty()
			})
		})
	}

	recipientGroupMebersBulkAdd() {
		this.validRowsTransformed.forEach(member => {
			this.recipientGroup.addMember({ email: member.email, name: member.name });
		});
		this.recipientGroup.save().then(
			() => {
				this.messageService.reportMinorSuccess(`Updated members for ${this.recipientGroup.name}`);
				this.navigateToIssuer();
			},
			error => this.messageService.reportAndThrowError(`Failed to import members into ${this.recipientGroup.name}`, error)
		);
	}


	removeValidRowsTransformed(row){
		this.validRowsTransformed.delete(row);
		// if(!this.validRowsTransformed.size){
		// 	this.disableActionButton();
		// }
	}

	removeButtonErrorState(row:number){
		this.removeInvalidRowsTransformed(row);
		this.removeErrorFormControll(row);
	}

	removeInvalidRowsTransformed(i:number){
		this.invalidRowsTransformed.splice(i,1);
	}

	removeErrorFormControll(controlIndex:number){
		const control = <FormArray>this.importErrorForm.controls['users'];
		control.removeAt(controlIndex);
	}
}

interface importCsvForm<T> {
	file: T;
}

interface RecipientGroupImportPreviewData{
	columnHeaders:ColumnHeaders[],
	rows:string[],
	validRows:string[][],
	invalidRows:string[][]
}

interface ColumnHeaders{
	destColumn: DestSelectOptions,
	sourceName: string
};

interface RecipientGroupImportData{
	name:string,
	email:string
};
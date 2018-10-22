import { ManagedEntity } from "../../common/model/managed-entity";
import { ApiEntityRef } from "../../common/model/entity-ref";
import {
	ApiRecipientBadgeInstance, RecipientBadgeInstanceRef,
	ApiRecipientBadgeClass, ApiRecipientBadgeRecipient
} from "./recipient-badge-api.model";
import { CommonEntityManager } from "../../entity-manager/common-entity-manager.service";
import { LinkedEntitySet } from "../../common/model/linked-entity-set";
import { RecipientBadgeCollection } from "./recipient-badge-collection.model";
import { RecipientBadgeCollectionRef } from "./recipient-badge-collection-api.model";

type BadgeMostRelevantStatusType = "new" | "expired";

export class RecipientBadgeInstance extends ManagedEntity<ApiRecipientBadgeInstance, RecipientBadgeInstanceRef> {
	/**
	 * Cached copy of the immutable issueDate for optimization
	 */
	_issueDate: Date;

	/**
	 * Cached copy of the immutable expiresDate for optimization
	 */
	_expiresDate: Date | null = null;

	/**
	 * List of collection that we've modified to either include or exclude ourselves from.
	 */
	private modifiedCollections: RecipientBadgeCollection[] = [];

	collections = new LinkedEntitySet<
		RecipientBadgeInstance,
		RecipientBadgeCollection,
		RecipientBadgeCollectionRef
	>(
		this,
		() => this.commonManager.recipientBadgeCollectionManager.recipientBadgeCollectionList.loadedPromise.then(
			list => list.entities.filter(c => c.containsBadge(this))
		),
		c => { c.addBadge(this); this.modifiedCollections.push(c); },
		c => { c.removeBadge(this); this.modifiedCollections.push(c); }
	);

	constructor(
		commonManager: CommonEntityManager,
		initialEntity: ApiRecipientBadgeInstance = null,
		onUpdateSubscribed: ()=>void = undefined
	) {
		super(commonManager, onUpdateSubscribed);

		if (initialEntity) {
			this.applyApiModel(initialEntity);
		}
	}

	protected buildApiRef(): ApiEntityRef {
		return {
			"@id": String(this.apiModel.id),
			slug: String(this.apiModel.id),
		}
	}

	public save(): Promise<this> {
		const collections = this.modifiedCollections;
		this.modifiedCollections = [];

		return Promise.all(collections.map(c => c.save())).then(() => this);
	}


	public revertChanges(): boolean {
		this.modifiedCollections.forEach(c => c.revertChanges());
		this.modifiedCollections = [];

		return super.revertChanges();
	}

	get type(): string { return this.apiModel.json.type }
	get recipientEmail(): string { return this.apiModel.recipient_identifier }
	get badgeClass(): ApiRecipientBadgeClass { return this.apiModel.json.badge }
	get issueDate(): Date { return this._issueDate ? this._issueDate : (this._issueDate = new Date(this.apiModel.json.issuedOn)) }
	get image(): string { return this.apiModel.image }
	get imagePreview(): string { return this.apiModel.imagePreview.id }
	get narrative(): string { return this.apiModel.narrative }
	get evidence_items(): any[] { return this.apiModel.evidence_items }

	get expiresDate(): Date { return this._expiresDate ? this._expiresDate : (this._expiresDate = this.apiModel.expiresOn && new Date(this.apiModel.expiresOn) || null) }

	get shareUrl(): string { return this.apiModel.shareUrl }

	get isNew(): boolean { return this.apiModel.acceptance === "Unaccepted" }
	
	get mostRelevantStatus(): BadgeMostRelevantStatusType | null {
		if (this.expiresDate && this.expiresDate < new Date()) { 
			return "expired"
		} else if (this.apiModel.acceptance === "Unaccepted") {
			return "new"
		} else {
			return null;
		}
	}
	

	markAccepted(): Promise<this> {
		if (this.isNew) {
			this.apiModel.acceptance = "Accepted";

			return this.recipientBadgeManager.recipientBadgeApiService
				.saveInstance(this.apiModel)
				.then(newModel => this.applyApiModel(newModel));
		} else {
			return Promise.resolve(this);
		}
	}

	get issuerId(): string {
		return this.apiModel.json.badge.issuer.id;
	}

	get criteriaUrl(): string {
		return this.badgeClass.criteria_url || this.badgeClass.criteria || null;
	}

	hasExtension(extensionName:string) {
		return (this.apiModel.extensions && extensionName in this.apiModel.extensions);
	}
	getExtension(extensionName:string, defaultValue) {
		return this.hasExtension(extensionName) ? this.apiModel.extensions[extensionName] : defaultValue;
	}
}
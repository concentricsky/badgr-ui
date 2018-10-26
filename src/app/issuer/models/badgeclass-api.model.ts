import { IssuerUrl } from "./issuer-api.model";
import { ApiEntityRef } from "../../common/model/entity-ref";

export type BadgeClassSlug = string;
export type BadgeClassUrl = string;
export type BadgeClassSqlId = number;
export interface BadgeClassRef extends ApiEntityRef {}

export type DurationUnitsType = "days" | "weeks" | "months" | "years";

export interface ApiBadgeClassJsonld {
	'@context': string
	type: string
	id: BadgeClassUrl

	name: string
	image: string
	description: string
	criteria_url: string
	criteria_text: string
	issuer: string
}

export interface ApiBadgeClassForCreation {
	name: string
	image: string
	description: string
	criteria_url: string
	criteria_text: string
	
	tags?: string[];
	alignment?: ApiBadgeClassAlignment[];
	expiration_duration_unit?: DurationUnitsType
	expiration_duration_value?: number
}

export interface ApiBadgeClassAlignment {
	target_name: string;
	target_url: string;
	target_description?: string;
	target_framework?: string;
	target_code?: string;
}



export interface ApiBadgeClass extends ApiBadgeClassForCreation {
	id: BadgeClassSqlId
	issuer: IssuerUrl

	slug: BadgeClassSlug

	recipient_count: number

	created_at: string
	created_by: string

	json: ApiBadgeClassJsonld


}
/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CollectiveOfferDisplayedStatus } from './CollectiveOfferDisplayedStatus';
import type { CollectiveOfferOfferVenueResponseModel } from './CollectiveOfferOfferVenueResponseModel';
import type { CollectiveOfferStatus } from './CollectiveOfferStatus';
import type { CollectiveOfferTemplateAllowedAction } from './CollectiveOfferTemplateAllowedAction';
import type { EacFormat } from './EacFormat';
import type { GetCollectiveOfferVenueResponseModel } from './GetCollectiveOfferVenueResponseModel';
import type { NationalProgramModel } from './NationalProgramModel';
import type { OfferContactFormEnum } from './OfferContactFormEnum';
import type { OfferDomain } from './OfferDomain';
import type { StudentLevels } from './StudentLevels';
import type { SubcategoryIdEnum } from './SubcategoryIdEnum';
import type { TemplateDatesModel } from './TemplateDatesModel';
export type GetCollectiveOfferTemplateResponseModel = {
  allowedActions: Array<CollectiveOfferTemplateAllowedAction>;
  audioDisabilityCompliant?: boolean | null;
  bookingEmails: Array<string>;
  contactEmail?: string | null;
  contactForm?: OfferContactFormEnum | null;
  contactPhone?: string | null;
  contactUrl?: string | null;
  dateCreated: string;
  dates?: TemplateDatesModel | null;
  description: string;
  displayedStatus: CollectiveOfferDisplayedStatus;
  domains: Array<OfferDomain>;
  durationMinutes?: number | null;
  educationalPriceDetail?: string | null;
  formats?: Array<EacFormat> | null;
  hasBookingLimitDatetimesPassed: boolean;
  id: number;
  imageCredit?: string | null;
  imageUrl?: string | null;
  interventionArea: Array<string>;
  isActive: boolean;
  isCancellable: boolean;
  isEditable: boolean;
  isNonFreeOffer?: boolean | null;
  isTemplate?: boolean;
  mentalDisabilityCompliant?: boolean | null;
  motorDisabilityCompliant?: boolean | null;
  name: string;
  nationalProgram?: NationalProgramModel | null;
  offerId?: number | null;
  offerVenue: CollectiveOfferOfferVenueResponseModel;
  status: CollectiveOfferStatus;
  students: Array<StudentLevels>;
  subcategoryId?: (SubcategoryIdEnum | string) | null;
  venue: GetCollectiveOfferVenueResponseModel;
  visualDisabilityCompliant?: boolean | null;
};


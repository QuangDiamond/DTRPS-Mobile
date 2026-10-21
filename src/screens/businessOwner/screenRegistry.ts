import type React from 'react';
import type { OwnerRoute } from './types';
import BusinessOwnerDashboardScreen from './BusinessOwnerDashboardScreen';
import MyBusinessLocationScreen from './MyBusinessLocationScreen';
import LocationDetailsScreen from './LocationDetailsScreen';
import EditLocationScreen from './EditLocationScreen';
import ManageServiceTagsScreen from './ManageServiceTagsScreen';
import LocationChangeRequestDetailsScreen from './LocationChangeRequestDetailsScreen';
import PricePromotionManagementScreen from './PricePromotionManagementScreen';
import PromotionDetailsScreen from './PromotionDetailsScreen';
import PromotionFormScreen from './PromotionFormScreen';
import ReviewManagementScreen from './ReviewManagementScreen';
import ReviewDetailsScreen from './ReviewDetailsScreen';
import FeedbackManagementScreen from './FeedbackManagementScreen';
import FeedbackDetailsScreen from './FeedbackDetailsScreen';
import BusinessOwnerProfileScreen from './BusinessOwnerProfileScreen';
import EditBusinessOwnerProfileScreen from './EditBusinessOwnerProfileScreen';
import BecomeBusinessOwnerScreen from './BecomeBusinessOwnerScreen';
import BusinessOwnerApplicationScreen from './BusinessOwnerApplicationScreen';
import ApplicationStatusScreen from './ApplicationStatusScreen';
import SubscriptionManagementScreen from './SubscriptionManagementScreen';
import SubscriptionRenewalScreen from './SubscriptionRenewalScreen';
import AdvertisementManagementScreen from './AdvertisementManagementScreen';
import AdvertisementFormScreen from './AdvertisementFormScreen';
import AdvertisementDetailsScreen from './AdvertisementDetailsScreen';
export const ownerScreens = {
  "Dashboard": BusinessOwnerDashboardScreen,
  "My Business Location": MyBusinessLocationScreen,
  "Location Details": LocationDetailsScreen,
  "Edit Location": EditLocationScreen,
  "Manage Service Tags": ManageServiceTagsScreen,
  "Location Change Request Details": LocationChangeRequestDetailsScreen,
  "Price / Promotion Management": PricePromotionManagementScreen,
  "Promotion Details": PromotionDetailsScreen,
  "Create / Edit Promotion": PromotionFormScreen,
  "Review Management": ReviewManagementScreen,
  "Review Details": ReviewDetailsScreen,
  "Feedback Management": FeedbackManagementScreen,
  "Feedback Details": FeedbackDetailsScreen,
  "Business Owner Profile": BusinessOwnerProfileScreen,
  "Edit Business Owner Profile": EditBusinessOwnerProfileScreen,
  "Become Business Owner": BecomeBusinessOwnerScreen,
  "Business Owner Application": BusinessOwnerApplicationScreen,
  "Application Status": ApplicationStatusScreen,
  "Subscription Management": SubscriptionManagementScreen,
  "Subscription Renewal / Payment": SubscriptionRenewalScreen,
  "Advertisement Management": AdvertisementManagementScreen,
  "Create / Edit Advertisement": AdvertisementFormScreen,
  "Advertisement Details / Approval Status": AdvertisementDetailsScreen,
} satisfies Record<OwnerRoute, React.ComponentType<import('./types').OwnerScreenProps>>;

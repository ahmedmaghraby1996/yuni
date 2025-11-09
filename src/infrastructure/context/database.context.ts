import { Otp } from '../entities/auth/otp.entity';
import { User } from '../entities/user/user.entity';
import { Address } from '../entities/user/address.entity';



import { Transaction } from '../entities/wallet/transaction.entity';
import { Wallet } from '../entities/wallet/wallet.entity';
import { NotificationEntity } from '../entities/notification/notification.entity';

import { SuggestionsComplaints } from '../entities/suggestions-complaints/suggestions-complaints.entity';
import { FaqQuestion } from '../entities/faq/faq_question';
import { StaticPage } from '../entities/static-pages/static-pages.entity';
import { ContactUs } from '../entities/contact-us/contact-us.entity';
import { City } from '../entities/city/city.entity';
import { Country } from '../entities/country/country.entity';
import { Store } from '../entities/store/store.entity';
import { Offer } from '../entities/offer/offer.entity';
import { OfferImages } from '../entities/offer/offer-images.entity';
import { Category } from '../entities/category/category.entity';
import { SubCategory } from '../entities/category/subcategory.entity';
import { Banar } from '../entities/banar/banar.entity';
import { OfferView } from '../entities/offer/offer-view.entity';
import { OffersService } from 'src/modules/offers/offers.service';
import { FavoriteOffer } from '../entities/offer/favorite-offer.entity';
import { Chat } from '../entities/chat/chat.entity';
import { Message } from '../entities/chat/messages.entity';
import { Package } from '../entities/package/package.entity';
import { Subscription } from '../entities/subscription/subscription.entity';
import { SystemVariable } from '../entities/system-variables/system-variable.entity';




export const DB_ENTITIES = [
  User,
  Address,
  Otp,
Country,
  Transaction,
  Wallet,
  NotificationEntity,
  Banar,
OfferView,
FavoriteOffer,
  SuggestionsComplaints,
  FaqQuestion,
  StaticPage,
  ContactUs,
    City,
    Country,
    Store,
    Offer,
    OfferImages,
    Category,
    SubCategory,
    Chat,
    Message,
    Package,
    Subscription,
    SystemVariable

];

export const DB_VIEWS = [];

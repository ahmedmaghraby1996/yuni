import { Exclude, Expose } from 'class-transformer';
import { toUrl } from 'src/core/helpers/file.helper';
@Exclude()
export class ContactUsResponse {
  @Expose() title_en: string;
  @Expose() title_ar: string;
  @Expose() logo: string;
  @Expose() url: string;

  constructor(data: Partial<ContactUsResponse>) {
    Object.assign(this, data);
    if (this.logo) {
      this.logo = toUrl(this.logo);
      console.log(this.logo);
    }
  }
}

import { HttpStatus } from '@nestjs/common';
import { ParseFilePipeBuilder } from '@nestjs/common';

export interface IUploadValidatorOptions {
  fileSize?: number;
  fileType?: RegExp;
  required?: boolean;
}

export class UploadValidator {
  public fileType: RegExp;
  public fileSize: number;
  public required: boolean;
  constructor(options?: IUploadValidatorOptions) {
    this.fileType =
      options?.fileType ??
      /^image\/(jpg|jpeg|png|svg\+xml)$|application\/(xlsx|pdf|msword|vnd.openxmlformats-officedocument.wordprocessingml.document|vnd.android.package-archive|doc|docx|vnd.ms-excel|vnd.openxmlformats-officedocument.spreadsheetml.sheet)$|audio\/(mp3|wav|ogg|x-m4a)$/i;
  
    this.fileSize = (options?.fileSize ?? 10) * 1024 * 1024;
    this.required = options?.required ?? false;
  }

  build() {
    return new ParseFilePipeBuilder()
      .addMaxSizeValidator({ maxSize: this.fileSize })
      .addFileTypeValidator({ fileType: this.fileType })
      .build({
        fileIsRequired: this.required,
        errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  }
}

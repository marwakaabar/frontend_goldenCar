import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Brand } from 'src/app/models/entities/brand';
import { Car } from 'src/app/models/entities/car';
import { CarImage } from 'src/app/models/entities/car-image';
import { Color } from 'src/app/models/entities/color';
import { UploadFile } from 'src/app/models/uploadFile';
import { BrandService } from 'src/app/services/brand.service';
import { CarImagesService } from 'src/app/services/car-images.service';
import { CarService } from 'src/app/services/car.service';
import { ColorService } from 'src/app/services/color.service';
import { ErrorService } from 'src/app/services/error.service';
import { FormService } from 'src/app/services/form.service';

@Component({
  selector: 'app-car-update',
  templateUrl: './admin-car-update.component.html',
  styleUrls: ['./admin-car-update.component.css']
})
export class CarUpdateComponent implements OnInit {
  currentCar: Car
  brands: Brand[];
  colors: Color[];
  years: number[] = [];
  carImages: CarImage[] = [];
  carUpdateForm: FormGroup;

  uploadFiles: UploadFile[] = [];
  uploadImagesPaths: any[] = []

  constructor(
    private carUpdateModal: MatDialogRef<CarUpdateComponent>,
    private colorService: ColorService,
    private brandService: BrandService,
    private carImageService: CarImagesService,
    private toastrService: ToastrService,
    private carService: CarService,
    private errorService: ErrorService,
    private formService: FormService
  ) { }

  ngOnInit(): void {
    this.getCarImages();
    this.getYears(100);
    this.getBrands();
    this.getColors();
    this.createCarUpdateForm();
  }

  update() {
    if (!this.carUpdateForm.valid) {
      this.toastrService.error("Votre formulaire est incorrect", "Formulaire invalide")
    } else {
      let carUpdateModel = Object.assign({}, this.carUpdateForm.value);
      carUpdateModel.Id = this.currentCar.id;
      let deletedImages = this.currentCar.carImages.filter(image => image.id != -1 && this.carImages.indexOf(image) == -1)
      let carInfoChanged: boolean = this.checkIfCarObjectChanged(carUpdateModel, this.currentCar);
      let carImagesChanged: boolean = this.checkIfCarImagesChanged(this.uploadFiles, deletedImages)
      if (!carInfoChanged && !carImagesChanged) {
        this.toastrService.error("Vous n'avez apporté aucune modification", "Non mis à jour")
      } else {
        if ((this.carImages.length + this.uploadFiles.length) > 5) { //Max 5 Image
          this.toastrService.error("Vous pouvez télécharger jusqu'à 5 images", "Échec de l'ajout de véhicules");
        } else {
          this.updateCarImages(deletedImages, this.uploadFiles).then((updateCarImageResult) => {
            this.carService.update(carUpdateModel).subscribe(updateSuccess => {
              if (updateCarImageResult.length > 0) {
                this.toastrService.warning("mise à jour avec succès, mais certaines images n'ont pas pu être mises à jour." + updateCarImageResult,"L'outil a été partiellement mis à jour" )
                this.closeCarUpdateModal();
              } else {
                this.toastrService.success("mise à jour avec succès", "mis à jour")
                this.closeCarUpdateModal();
              }
            }, errorResponse => {
              this.errorService.showBackendError(errorResponse, "Échec de la mise à jour");
            })
          });
        }
      }
    }
  }

  private checkIfCarImagesChanged(uploadList: UploadFile[], deleteList: CarImage[]) {
    return !(uploadList.length === 0 && deleteList.length === 0)
  }

  private checkIfCarObjectChanged(newCarObject: any, oldCarObject: Car,) {
    return !(newCarObject.brandId == oldCarObject.brandId &&
      newCarObject.colorId == oldCarObject.colorId &&
      newCarObject.modelName == oldCarObject.modelName &&
      newCarObject.modelYear == oldCarObject.modelYear &&
      newCarObject.dailyPrice == oldCarObject.dailyPrice &&
      newCarObject.description == oldCarObject.description)
  }

  private updateCarImages(deletedImages: CarImage[], uploadFiles: UploadFile[]): Promise<string> {
    return new Promise<string>((methodResolve) => {
      if (this.carImages.length < this.currentCar.carImages.length) { //If the car image was deleted
        deletedImages = this.currentCar.carImages.filter(image => image.id != -1 && this.carImages.indexOf(image) == -1);
      }
      let unDeletedImagesList: string = "";
      let unUploadedFileList: string = "";
      let deletePromise = new Promise<void>((deletePromiseResolve) => {
        this.deleteAllSelectedImagesFromServer(deletedImages).then((deleteResolve) => {
          if (deleteResolve.length > 0) {
            for (let i = 0; i < deleteResolve.length; i++) {
              unDeletedImagesList += deleteResolve[i].id + ', ';
              if (i === deleteResolve.length - 1) {
                deletePromiseResolve();
              }
            }
          } else {
            deletePromiseResolve();
          }
        })
      })
      deletePromise.then(() => {
        let uploadPromise = new Promise<void>((uploadPromiseResolve) => {
          this.uploadAllImagesToServer(uploadFiles).then((uploadResolve) => {
            if (uploadResolve.length > 0) {
              for (let i = 0; i < uploadResolve.length; i++) {
                unUploadedFileList += uploadResolve[i].file.name + ', ';
                if (i === uploadResolve.length - 1) {
                  uploadPromiseResolve();
                }
              }
            } else {
              uploadPromiseResolve();
            }
          })
        })
        uploadPromise.then(() => {
          let resultString = "";
          if (unDeletedImagesList.length > 0) {
            resultString += "ID d'image non supprimés :" + unDeletedImagesList
          }
          if (unUploadedFileList.length > 0) {
            resultString += "Impossible de charger les images : " + unUploadedFileList
          }
          methodResolve(resultString);
        })
      })
    })
  }

  private deleteAllSelectedImagesFromServer(deletedImages: CarImage[]): Promise<CarImage[]> {
    return new Promise<CarImage[]>((methodResolve) => {
      if (deletedImages.length > 0) {
        let unDeletedImages: CarImage[] = [];
        const allDelets = new Promise<void>(async (resolveAllDelets) => {
          let counter = 0;
          for (const image of deletedImages) {
            await this.deleteImageFromServer(image).then((deleteSuccessFile) => {
            }, (deleteFailFile) => {
              unDeletedImages.push(deleteFailFile);
            }).then(() => {
              counter += 1;
              if (counter === deletedImages.length) {
                resolveAllDelets();
              }
            })
          }
        });
        allDelets.then(() => {
          methodResolve(unDeletedImages);
        })
      } else {
        let emptyArray: CarImage[] = [];
        methodResolve(emptyArray);
      }
    })
  }

  private deleteImageFromServer(deletedImage: CarImage): Promise<CarImage> {
    return new Promise<CarImage>((resolve, reject) => {
      this.carImageService.deleteImage(deletedImage).subscribe(deleteSuccess => {
        resolve(deletedImage);
      }, deleteFail => {
        reject(deletedImage);
      })
    })
  }

  private uploadAllImagesToServer(uploadFiles: UploadFile[]): Promise<UploadFile[]> {
    return new Promise<UploadFile[]>((methodResolve) => {
      if (uploadFiles.length > 0) {
        let unUploadedFiles: UploadFile[] = []
        const allUploads = new Promise<void>(async (resolveAllUploads) => {
          let counter = 0;
          for (const file of uploadFiles) {
            await this.uploadImageToServer(file).then((fileStatus) => {
              if (fileStatus.uploadStatus === false) {
                unUploadedFiles.push(fileStatus)
              }
            }).then(() => {
              counter += 1;
              if (counter === uploadFiles.length) {
                resolveAllUploads();
              }
            });
          }
        })
        allUploads.then(() => {
          methodResolve(unUploadedFiles);
        })
      } else {
        let emptyArray: UploadFile[] = [];
        methodResolve(emptyArray);
      }
    })
  }

  private uploadImageToServer(uploadFile: UploadFile): Promise<UploadFile> {
    return new Promise<UploadFile>((result) => {
      this.carImageService.uploadImage(uploadFile.file, this.currentCar.id).subscribe((uploadSuccess) => {
        uploadFile.uploadStatus = true;
        result(uploadFile);
      }, uploadFail => {
        uploadFile.uploadStatus = false;
        result(uploadFile);
      })
    })
  }

  addCarImagesToUploadAndPathList(imageList: any) {
    if (imageList.length !== 0) {
      if ((this.carImages.length + this.uploadFiles.length) < 5) {
        for (let i = 0; i < imageList.length; i++) {
          let uploadFile = new UploadFile();
          let image = imageList[i];
          uploadFile.file = image;
          uploadFile.uploadStatus = false;
          let preselectedFile = this.uploadFiles.find(uploadFile => uploadFile.file.name === image.name);
          if (preselectedFile === undefined) {
            this.addCarImageToUploadImagesPath(image).then((success) => {
              if (success) {
                this.uploadFiles.push(uploadFile);
              }
            });
          } else {
            this.toastrService.warning("Vous avez déjà ajouté cette photo à la liste", "Déjà sur la liste");
          }
        }
      } else {
        this.toastrService.error("Vous pouvez ajouter jusqu'à 5 images", "Aucune image n'est jointe");
      }
    }
  }

  private addCarImageToUploadImagesPath(image: any): Promise<boolean> { //Source: https://www.talkingdotnet.com/show-image-preview-before-uploading-using-angular-7/
    return new Promise<boolean>((result) => {
      this.checkFileMimeType(image).then((successStatus) => {
        if (successStatus) {
          var reader = new FileReader();
          reader.readAsDataURL(image);
          reader.onload = (_event) => {
            this.uploadImagesPaths.push(reader.result);
            result(true);
          }
        } else {
          this.toastrService.error("Vous ne pouvez télécharger qu'un fichier image", "Échec de la pièce jointe du fichier");
          result(false);
        }
      })
    })
  }

  private checkFileMimeType(file: any): Promise<boolean> {
    return new Promise<boolean>((methodResolve) => {
      var mimeType = file.type;
      methodResolve(mimeType.match(/image\/*/) != null);
    })
  }

  private createCarUpdateForm() {
    this.carUpdateForm = this.formService.createCarForm();
    this.autoFillFieldsInCarUpdateForm();
  }

  private autoFillFieldsInCarUpdateForm() {
    let keys = Object.keys(this.carUpdateForm.controls);
    keys.forEach(key => {
      let keyErrors = this.carUpdateForm.get(key)?.errors;
      if (keyErrors != null) {
        let errorList = Object.keys(keyErrors);
        if (errorList.indexOf("required") != -1) {
          let car = Object.entries(this.currentCar);
          car.forEach(entries => {
            if (entries[0] == key) {
              this.carUpdateForm.get(key)?.setValue(entries[1])
            }
          });
        }
      }
    })
  }

  deleteImageFromCarImages(image: CarImage) {
    this.carImages.splice(this.carImages.indexOf(image), 1);
  }

  deleteImageFromUploadFiles(uploadFile: UploadFile) {
    this.uploadImagesPaths.splice(this.uploadImagesPaths.indexOf(uploadFile), 1);
    this.uploadFiles.splice(this.uploadFiles.indexOf(uploadFile), 1);
  }

  getImagePath(imagePath: string) {
    return this.carImageService.getImagePath(imagePath);
  }

  private getCarImages() {
    this.currentCar.carImages.forEach(image => {
      if (image.id != -1) { //Do not add the default vehicle image to the list.
        this.carImages.push(image);
      }
    });
    //this.carImages = this.currentCar.carImages;  -> This code will not work as arrays are reference type. Changes made to one list affect the other list.
  }

  private getYears(decreaseYear: number) {
    let year: number = new Date().getFullYear();
    this.years.push(year);
    for (let i = 1; i < decreaseYear + 1; i++) {
      this.years.push(year - i);
    }
  }

  private getColors() {
    this.colorService.getColors().subscribe(response => {
      this.colors = response.data;
    })
  }

  private getBrands() {
    this.brandService.getBrands().subscribe(response => {
      this.brands = response.data;
    })
  }

  closeCarUpdateModal() {
    this.carUpdateModal.close();
  }
}

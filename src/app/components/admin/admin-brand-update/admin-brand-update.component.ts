import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Brand } from 'src/app/models/entities/brand';
import { BrandService } from 'src/app/services/brand.service';
import { ErrorService } from 'src/app/services/error.service';
import { FormService } from 'src/app/services/form.service';

@Component({
  selector: 'app-brand-update',
  templateUrl: './admin-brand-update.component.html',
  styleUrls: ['./admin-brand-update.component.css']
})
export class BrandUpdateComponent implements OnInit {
  currentBrand: Brand;
  brandUpdateForm: FormGroup

  constructor(
    private brandService: BrandService,
    private toastrService: ToastrService,
    private updateModal: MatDialogRef<BrandUpdateComponent>,
    private errorService: ErrorService,
    private formService: FormService
  ) { }

  ngOnInit(): void {
    this.createBrandUpdateForm();
  }

  update() {
    if (this.brandUpdateForm.valid) {
      let newBrand = Object.assign({}, this.brandUpdateForm.value);
      newBrand.id = this.currentBrand.id;

      if (newBrand.name == this.currentBrand.name) {
        this.toastrService.error("Nom de marque identique à avant", "Échec de la mise à jour");
        return;
      }

      this.brandService.update(newBrand).subscribe(() => {
        this.toastrService.success(this.currentBrand.name + ", " + newBrand.name + "mis à jour", "Mise à jour réussie");
        this.closeUpdateModal();
      }, errorResponse => {
        this.errorService.showBackendError(errorResponse, "Échec de la mise à jour de la marque");
      })

    } else {
      this.toastrService.error("Le nom de la marque doit comporter entre 2 et 50 caractères", "Formulaire invalide");
      this.brandUpdateForm.reset();
    }
  }

  closeUpdateModal() {
    this.updateModal.close();
  }

  createBrandUpdateForm() {
    this.brandUpdateForm = this.formService.createBrandForm();
  }
}

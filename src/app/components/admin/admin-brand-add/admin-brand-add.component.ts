import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms'
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { BrandService } from 'src/app/services/brand.service';
import { ErrorService } from 'src/app/services/error.service';
import { FormService } from 'src/app/services/form.service';

@Component({
  selector: 'app-brand-add',
  templateUrl: './admin-brand-add.component.html',
  styleUrls: ['./admin-brand-add.component.css']
})
export class BrandAddComponent implements OnInit {
  brandAddForm: FormGroup;
  constructor(
    private brandService: BrandService,
    private toastrService: ToastrService,
    private brandAddModal: MatDialogRef<BrandAddComponent>,
    private errorService: ErrorService,
    private formService: FormService
  ) { }

  ngOnInit(): void {
    this.createBrandAddForm();
  }

  createBrandAddForm() {
    this.brandAddForm = this.formService.createBrandForm();
  }

  closeBrandAddModal() {
    this.brandAddModal.close();
  }

  add() {
    if (this.brandAddForm.valid) {
      let brandModel = Object.assign({}, this.brandAddForm.value);
      this.brandService.add(brandModel).subscribe(() => {
        this.toastrService.success(brandModel.name, "Marque ajoutée avec succès");
        this.closeBrandAddModal();
      }, errorResponse => {
        this.errorService.showBackendError(errorResponse, "Impossible d'ajouter une marque");
      })
    } else {
      this.toastrService.error("Le nom de la marque doit comporter entre 2 et 50 caractères", "Forme non valide");
      this.brandAddForm.reset();
    }
  }
}

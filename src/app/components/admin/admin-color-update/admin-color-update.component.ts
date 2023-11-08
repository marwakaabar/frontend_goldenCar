import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastrService } from 'ngx-toastr';
import { Color } from 'src/app/models/entities/color';
import { ColorService } from 'src/app/services/color.service';
import { ErrorService } from 'src/app/services/error.service';
import { FormService } from 'src/app/services/form.service';

@Component({
  selector: 'app-color-update',
  templateUrl: './admin-color-update.component.html',
  styleUrls: ['./admin-color-update.component.css']
})
export class ColorUpdateComponent implements OnInit {
  currentColor: Color;
  colorUpdateForm: FormGroup
  constructor(
    private updateColorModal: MatDialogRef<ColorUpdateComponent>,
    private colorService: ColorService,
    private toastrService: ToastrService,
    private errorService: ErrorService,
    private formService: FormService
  ) { }

  ngOnInit(): void {
    this.createcolorUpdateForm();
  }

  update() {
    if (this.colorUpdateForm.valid) {
      let newColor = Object.assign({}, this.colorUpdateForm.value);
      newColor.id = this.currentColor.id;

      if (newColor.name == this.currentColor.name) {
        this.toastrService.error("Nom de la couleur identique à avant", "Échec de la mise à jour");
        return;
      }

      this.colorService.update(newColor).subscribe(() => {
        this.toastrService.success(this.currentColor.name + ", " + newColor.name + "mis à jour", "Mise à jour réussie");
        this.closeColorUpdateModal();
      }, errorResponse => {
        this.errorService.showBackendError(errorResponse, "Échec de la mise à jour des couleurs");
      })

    } else {
      this.toastrService.error("Le nom de la couleur doit comporter entre 2 et 50 caractères", "Le formulaire n'est pas valide");
      this.colorUpdateForm.reset();
    }
  }

  closeColorUpdateModal() {
    this.updateColorModal.close();
  }

  createcolorUpdateForm() {
    this.colorUpdateForm = this.formService.createColorForm();
  }

}

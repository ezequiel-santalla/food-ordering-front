import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FoodVenueService } from '../../services/food-venue-service';
import { FoodVenueAdminResponse } from '../../models/response/food-venue-reponse';
import { FoodVenueRequest } from '../../models/request/food-venue-request';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-food-venue-page',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './my-food-venue-page.html'
})
export class MyFoodVenuePage {

venueForm!: FormGroup;
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private foodVenueService: FoodVenueService
  ) {}

  ngOnInit(): void {

    this.initForm();
    this.loadVenueData();
  }

  initForm(): void {
    this.venueForm = this.fb.group({

      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      description: [''],


      address: this.fb.group({
        street: ['', Validators.required],
        number: ['', Validators.required],
        city: ['', Validators.required],
        province: ['', Validators.required],
        postalCode: ['', Validators.required],
        country: ['', Validators.required]
      }),


      style: this.fb.group({
        logoUrl: [''],
        bannerUrl: [''],
        instagramUrl: [''],
        facebookUrl: [''],
        whatsappNumber: ['']
      })
    });
  }

  loadVenueData(): void {
    this.loading = true;
    this.foodVenueService.getMyFoodVenue().subscribe({
      next: (data: FoodVenueAdminResponse) => {

        this.venueForm.patchValue({
          name: data.name,
          email: data.email,
          phone: data.phone,
          description: data.style?.description || '',
          address: data.address,
          style: data.style
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar datos del local', err);
        this.loading = false;

      }
    });
  }

  saveChanges(): void {
    if (this.venueForm.invalid) {
      this.venueForm.markAllAsTouched();
      console.error('El formulario es inválido.');
      return;
    }

    this.loading = true;
    const formValue = this.venueForm.value;

    const updateDto: Partial<FoodVenueRequest> = {
      name: formValue.name,
      email: formValue.email,
      phone: formValue.phone,
      address: formValue.address,


      styleRequestDto: {
        ...formValue.style,
        description: formValue.description
      }
    };


    this.foodVenueService.updateMyCurrentFoodVenue(updateDto).subscribe({
      next: (response) => {
        console.log('Local actualizado con éxito', response);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al actualizar local', err);
        this.loading = false;
      }
    });
  }

}

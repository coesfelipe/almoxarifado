import { ComponentFixture, TestBed } from '@angular/core/testing';
import { XmlUpload } from './xml-uploud';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('XmlUpload', () => {
  let component: XmlUpload;
  let fixture: ComponentFixture<XmlUpload>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XmlUpload],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(XmlUpload);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

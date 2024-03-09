interface Department {
  departmentName: string;
  specializations: string[];
}

type DepartmentClass =
  | Radiology
  | Oncology
  | Neurosurgery
  | Pathology
  | InternalMedicine
  | Pulmonology
  | Gastroenterology
  | Urology
  | Orthopedics
  | Hematology;

class Radiology implements Department {
  departmentName = 'Radiology';
  specializations = ['Radiologist', 'Radiologic Technologist'];
}

class Oncology implements Department {
  departmentName = 'Oncology';
  specializations = ['Medical Oncologist', 'Hematologist'];
}

class Neurosurgery implements Department {
  departmentName = 'Neurosurgery';
  specializations = ['Neurosurgeon', 'Neuro-oncologist'];
}

class Pathology implements Department {
  departmentName = 'Pathology';
  specializations = ['Pathologist'];
}

class InternalMedicine implements Department {
  departmentName = 'Internal Medicine';
  specializations = ['Internist'];
}

class Pulmonology implements Department {
  departmentName = 'Pulmonology';
  specializations = ['Pulmonologist'];
}

class Gastroenterology implements Department {
  departmentName = 'Gastroenterology';
  specializations = ['Gastroenterologist'];
}

class Urology implements Department {
  departmentName = 'Urology';
  specializations = ['Urologist'];
}

class Orthopedics implements Department {
  departmentName = 'Orthopedics';
  specializations = ['Orthopedic Surgeon'];
}

class Hematology implements Department {
  departmentName = 'Hematology';
  specializations = ['Hematologist'];
}

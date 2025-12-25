
'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setDocumentNonBlocking, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { MedicineStore } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { MapPin } from 'lucide-react';
import { Textarea } from '../ui/textarea';

const workingDaysOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function MedicineStoreProfileForm({ store }: { store: MedicineStore }) {
  const firestore = useFirestore();
  const [storeData, setStoreData] = useState<Partial<MedicineStore>>({});

  useEffect(() => {
    if (store) {
      setStoreData(store);
    }
  }, [store]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setStoreData(prev => ({...prev, [id]: value}));
  }

  const handleCheckboxChange = (id: string, checked: boolean) => {
       setStoreData(prev => {
            const currentServices = prev.services || {};
            return {
                ...prev,
                services: {
                    ...currentServices,
                    [id]: checked
                }
            }
       });
  }

  const handleWorkingDaysChange = (day: string, checked: boolean) => {
      setStoreData(prev => {
          const currentDays = prev.workingDays || [];
          if (checked) {
              return {...prev, workingDays: [...currentDays, day]};
          } else {
              return {...prev, workingDays: currentDays.filter(d => d !== day)};
          }
      });
  }

  const handleSaveChanges = () => {
    const storeDocRef = doc(firestore, 'medicine_stores', store.id);
    if (storeDocRef && storeData) {
      setDocumentNonBlocking(storeDocRef, storeData, { merge: true });
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pharmacy Profile</CardTitle>
          <CardDescription>
            Manage your store's information and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-8">
            {/* Owner Details */}
            <div>
              <h3 className="text-lg font-medium">Owner Details</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ownerName">Owner Full Name</Label>
                  <Input id="ownerName" value={storeData.ownerName || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" value={storeData.email || ''} onChange={handleInputChange} disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <Input id="phone" value={storeData.phone || ''} onChange={handleInputChange} />
                </div>
              </div>
            </div>

            {/* Pharmacy Details */}
            <div>
              <h3 className="text-lg font-medium">Pharmacy Details</h3>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Pharmacy Name</Label>
                  <Input id="name" value={storeData.name || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="licenseNumber">Pharmacy License Number</Label>
                  <Input id="licenseNumber" value={storeData.licenseNumber || ''} onChange={handleInputChange} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="licenseExpiryDate">License Expiry Date</Label>
                    <Input id="licenseExpiryDate" type="date" value={storeData.licenseExpiryDate ? new Date(storeData.licenseExpiryDate).toISOString().split('T')[0] : ''} onChange={handleInputChange} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="licenseDocument">License Document</Label>
                    <Input id="licenseDocument" type="file" />
                </div>
              </div>
            </div>
            
            {/* Store Location */}
            <div>
                <h3 className="text-lg font-medium">Store Location</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="address">Complete Address</Label>
                        <Textarea id="address" value={storeData.address || ''} onChange={handleInputChange} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={storeData.city || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" value={storeData.state || ''} onChange={handleInputChange} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pincode">PIN Code</Label>
                        <Input id="pincode" value={storeData.pincode || ''} onChange={handleInputChange} />
                    </div>
                </div>
                 <div className="grid gap-2 mt-4">
                    <Label>Map Location</Label>
                    <div className="relative">
                        <Input disabled value="123 Main St, Anytown, USA" />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1 h-8 w-8">
                            <MapPin className="h-4 w-4"/>
                        </Button>
                    </div>
                </div>
            </div>
            
            {/* Operating Information */}
             <div>
                <h3 className="text-lg font-medium">Operating Information</h3>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="openingTime">Opening Time</Label>
                            <Input id="openingTime" type="time" value={storeData.openingTime || ''} onChange={handleInputChange} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="closingTime">Closing Time</Label>
                            <Input id="closingTime" type="time" value={storeData.closingTime || ''} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label>Home Delivery</Label>
                         <RadioGroup
                            defaultValue={storeData.homeDelivery ? 'yes' : 'no'}
                            onValueChange={(value) => setStoreData(prev => ({...prev, homeDelivery: value === 'yes'}))}
                            className="flex items-center space-x-4 pt-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="delivery-yes" />
                                <Label htmlFor="delivery-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="delivery-no" />
                                <Label htmlFor="delivery-no">No</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <div className="grid gap-2 mt-4">
                     <Label>Working Days</Label>
                     <div className="flex flex-wrap gap-4 pt-2">
                        {workingDaysOptions.map(day => (
                             <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                    id={day}
                                    checked={storeData.workingDays?.includes(day)}
                                    onCheckedChange={(checked) => handleWorkingDaysChange(day, !!checked)}
                                />
                                <label
                                    htmlFor={day}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {day}
                                </label>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            {/* Services Offered */}
             <div>
                <h3 className="text-lg font-medium">Services Offered</h3>
                <Separator className="my-4" />
                <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="prescription" checked={storeData.services?.prescription} onCheckedChange={(checked) => handleCheckboxChange('prescription', !!checked)} />
                        <Label htmlFor="prescription">Prescription Medicines</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="otc" checked={storeData.services?.otc} onCheckedChange={(checked) => handleCheckboxChange('otc', !!checked)} />
                        <Label htmlFor="otc">OTC Medicines</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="generic" checked={storeData.services?.generic} onCheckedChange={(checked) => handleCheckboxChange('generic', !!checked)} />
                        <Label htmlFor="generic">Generic Medicines</Label>
                    </div>
                </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSaveChanges}>Save Changes</Button>
        </CardFooter>
      </Card>
    </div>
  );
}


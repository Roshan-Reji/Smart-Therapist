import { CheckCircle2, Clock, Calendar, User, MessageSquare, CreditCard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type BookingConfirmationProps = {
  booking: {
    therapistName: string;
    date: string;
    time: string;
    fee: string;
    notes?: string;
  };
  onClose: () => void;
};

export function BookingConfirmation({ booking, onClose }: BookingConfirmationProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Booking Confirmed!
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-medium">Your session is booked!</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation to your email with all the details.
            </p>
          </div>

          <div className="rounded-lg border p-4 space-y-4">
            <h4 className="font-medium">Session Details</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{booking.therapistName}</p>
                  <p className="text-muted-foreground text-sm">Therapist</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{booking.date}</p>
                  <p className="text-muted-foreground text-sm">Date</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{booking.time}</p>
                  <p className="text-muted-foreground text-sm">Time</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="font-medium">{booking.fee}</p>
                  <p className="text-muted-foreground text-sm">Session Fee</p>
                </div>
              </div>
              
              {booking.notes && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">Your Notes</p>
                    <p className="text-muted-foreground text-sm">{booking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">What's next?</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You'll receive a confirmation email with a calendar invite</li>
              <li>Join the session 5 minutes before the scheduled time</li>
              <li>Make sure you have a stable internet connection</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={onClose} className="min-w-[120px]">
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

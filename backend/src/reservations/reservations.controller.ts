import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  UseGuards,
  Query,
  Request,
} from "@nestjs/common";
import { ReservationsService } from "./reservations.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("reservations")
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get()
  async findAll(
    @Query("status") status?: string,
    @Query("date") date?: string,
  ) {
    const reservations = await this.reservationsService.findAll({
      status,
      date,
    });
    return {
      message: "Reservations retrieved successfully",
      data: reservations,
    };
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const reservation = await this.reservationsService.findOne(id);
    return { message: "Reservation retrieved successfully", data: reservation };
  }

  @Post()
  async create(@Body() dto: any, @Request() req: any) {
    const reservation = await this.reservationsService.create(dto, req.user.id);
    return { message: "Reservation created successfully", data: reservation };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: any, @Request() req: any) {
    const reservation = await this.reservationsService.update(
      id,
      dto,
      req.user.id,
      req.user.role?.name,
    );
    return { message: "Reservation updated successfully", data: reservation };
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req: any) {
    await this.reservationsService.remove(id, req.user.id, req.user.role?.name);
    return { message: "Reservation deleted successfully" };
  }

  @Patch(":id/cancel")
  async cancel(@Param("id") id: string, @Body() dto: any, @Request() req: any) {
    const reservation = await this.reservationsService.cancel(
      id,
      dto.reason,
      req.user.id,
      req.user.role?.name,
    );
    return { message: "Reservation cancelled successfully", data: reservation };
  }

  @Patch(":id/confirm")
  async confirm(@Param("id") id: string) {
    const reservation = await this.reservationsService.confirm(id);
    return { message: "Reservation confirmed successfully", data: reservation };
  }

  @Patch(":id/check-in")
  async checkIn(@Param("id") id: string) {
    const reservation = await this.reservationsService.checkIn(id);
    return { message: "Checked in successfully", data: reservation };
  }

  @Patch(":id/check-out")
  async checkOut(@Param("id") id: string) {
    const reservation = await this.reservationsService.checkOut(id);
    return { message: "Checked out successfully", data: reservation };
  }

  @Patch(":id/approve-cancel")
  async approveCancelRequest(@Param("id") id: string) {
    const reservation = await this.reservationsService.approveCancelRequest(id);
    return { message: "Cancel request approved", data: reservation };
  }

  @Patch(":id/reject-cancel")
  async rejectCancelRequest(@Param("id") id: string, @Body() dto: any) {
    const reservation = await this.reservationsService.rejectCancelRequest(id);
    return { message: "Cancel request rejected", data: reservation };
  }
}

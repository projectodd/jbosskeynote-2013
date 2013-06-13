class UsersController < ApplicationController

  def index
    @users = User.all
    @tab = :users
  end

  def new
    @user = User.new
    @tab = :users
  end

  def create
    @user = User.new
    @user.identifier = params[:identifier]
    @user.save
    redirect_to @user
  end

  def show
    @user = User.find( params[:id] )
    redirect_to :index and return unless @user
  end

end
